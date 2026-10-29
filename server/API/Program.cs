using System.Security.Claims;
using System.Text;
using System.Threading.RateLimiting;
using API;
using Infra;
using LinqToDB;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Service;

const string CookieName = "access_token";

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// Hemmeligheder kommer fra miljøvariabler/user-secrets - aldrig fra filer i git.
var connectionString = config.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is missing");
var jwtKey = config["Jwt:Key"];
if (jwtKey is null || jwtKey.Length < 32)
    throw new InvalidOperationException("Jwt:Key must be at least 32 characters");
var issuer = config["Jwt:Issuer"]!;
var audience = config["Jwt:Audience"]!;
var cookieSecure = config.GetValue("Jwt:CookieSecure", true);

builder.Services.AddScoped(_ => new AppDb(new DataOptions().UsePostgreSQL(connectionString)));
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<UserService>();
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddSingleton(new JwtTokenService(jwtKey, issuer, audience));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.MapInboundClaims = false;
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = "sub",
            RoleClaimType = "role"
        };
        // Token læses kun fra HttpOnly-cookien, så JavaScript aldrig kan tilgå det.
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies[CookieName];
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization();

// Brute-force-beskyttelse: maks 5 loginforsøg pr. minut pr. IP.
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy("login", ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});

var corsOrigin = config["Cors:Origin"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (!string.IsNullOrEmpty(corsOrigin))
        p.WithOrigins(corsOrigin).AllowCredentials().AllowAnyHeader().AllowAnyMethod();
}));

var app = builder.Build();

// Swagger kun i Development, så det ikke er eksponeret i produktion.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "KnB API");
        c.RoutePrefix = string.Empty; // Swagger UI på /
    });
}

// Opret tabel og første admin (kun hvis tabellen er tom og Admin:Password er sat).
using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<UserRepository>().EnsureSchemaAsync();
    var adminPassword = config["Admin:Password"];
    if (!string.IsNullOrEmpty(adminPassword))
        await scope.ServiceProvider.GetRequiredService<UserService>()
            .SeedAdminAsync(config["Admin:Username"] ?? "admin", adminPassword);
}

app.UseExceptionHandler(handler => handler.Run(async ctx =>
{
    var error = ctx.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, message) = error switch
    {
        InvalidInputException e => (400, e.Message),
        ForbiddenException e => (403, e.Message),
        NotFoundException e => (404, e.Message),
        ConflictException e => (409, e.Message),
        _ => (500, "Internal server error") // interne detaljer lækkes aldrig
    };
    ctx.Response.StatusCode = status;
    await ctx.Response.WriteAsJsonAsync(new { error = message });
}));
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

static Actor GetActor(ClaimsPrincipal p) =>
    new(int.Parse(p.FindFirstValue("sub")!), p.FindFirstValue("role")!);

var auth = app.MapGroup("/api/auth");

auth.MapPost("/login", async (LoginRequest req, UserService users, JwtTokenService jwt, HttpContext ctx) =>
{
    if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrEmpty(req.Password))
        return Results.BadRequest(new { error = "Username and password are required" });

    var user = await users.LoginAsync(req.Username, req.Password);
    if (user is null) return Results.Unauthorized(); // samme svar uanset årsag

    var (token, expires) = jwt.Create(user);
    ctx.Response.Cookies.Append(CookieName, token, new CookieOptions
    {
        HttpOnly = true,
        Secure = cookieSecure,
        SameSite = SameSiteMode.Strict, // beskytter mod CSRF
        Expires = expires,
        Path = "/"
    });
    return Results.Ok(user);
}).RequireRateLimiting("login");

auth.MapPost("/logout", (HttpContext ctx) =>
{
    ctx.Response.Cookies.Delete(CookieName, new CookieOptions
    {
        HttpOnly = true, Secure = cookieSecure, SameSite = SameSiteMode.Strict, Path = "/"
    });
    return Results.NoContent();
});

auth.MapGet("/me", (ClaimsPrincipal p) => Results.Ok(GetActor(p))).RequireAuthorization();

// Alle roller må læse; skrivning kræver superuser eller admin.
// Den fine regel (hvem må rette hvem) håndhæves i UserService.
var usersApi = app.MapGroup("/api/users").RequireAuthorization();
var writers = new[] { Roles.SuperUser, Roles.Admin };

usersApi.MapGet("/", (UserService users) => users.GetAllAsync());
usersApi.MapGet("/{id:int}", (int id, UserService users) => users.GetByIdAsync(id));

usersApi.MapPost("/", async (CreateUserRequest req, ClaimsPrincipal p, UserService users) =>
{
    var created = await users.CreateAsync(GetActor(p), req);
    return Results.Created($"/api/users/{created.Id}", created);
}).RequireAuthorization(policy => policy.RequireRole(writers));

usersApi.MapPut("/{id:int}", (int id, UpdateUserRequest req, ClaimsPrincipal p, UserService users) =>
    users.UpdateAsync(GetActor(p), id, req))
    .RequireAuthorization(policy => policy.RequireRole(writers));

usersApi.MapDelete("/{id:int}", async (int id, ClaimsPrincipal p, UserService users) =>
{
    await users.DeleteAsync(GetActor(p), id);
    return Results.NoContent();
}).RequireAuthorization(policy => policy.RequireRole(writers));

app.Run();

record LoginRequest(string Username, string Password);