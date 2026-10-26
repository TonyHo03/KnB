using Infra;

namespace Service;

public record UserDto(int Id, string Username, string Role);
public record CreateUserRequest(string Username, string Password, string Role);
public record UpdateUserRequest(string Username, string Role, string? Password);
public record Actor(int Id, string Role);

public class UserService(UserRepository repo, PasswordHasher hasher)
{
    private const int MinPasswordLength = 12;
    private const int MaxPasswordLength = 128; // begrænser DoS via meget lange input til Argon2

    public async Task<UserDto?> LoginAsync(string username, string password)
    {
        if (password.Length > MaxPasswordLength) return null;

        var user = await repo.GetByUsernameAsync(Normalize(username));
        var ok = hasher.Verify(user?.PasswordHash ?? hasher.DummyHash, password);
        return user is not null && ok ? ToDto(user) : null;
    }

    public async Task SeedAdminAsync(string username, string password)
    {
        if (await repo.AnyAsync()) return;
        ValidatePassword(password);
        await repo.InsertAsync(new User
        {
            Username = Normalize(username),
            PasswordHash = hasher.Hash(password),
            Role = Roles.Admin
        });
    }

    // Alle roller må læse.
    public async Task<List<UserDto>> GetAllAsync() =>
        (await repo.GetAllAsync()).Select(ToDto).ToList();

    public async Task<UserDto> GetByIdAsync(int id) =>
        ToDto(await repo.GetByIdAsync(id) ?? throw new NotFoundException());

    public async Task<UserDto> CreateAsync(Actor actor, CreateUserRequest request)
    {
        var username = ValidateUsername(request.Username);
        ValidateRole(request.Role);
        ValidatePassword(request.Password);
        EnsureCanManage(actor, request.Role);

        if (await repo.GetByUsernameAsync(username) is not null)
            throw new ConflictException("Username already exists");

        var user = new User
        {
            Username = username,
            PasswordHash = hasher.Hash(request.Password),
            Role = request.Role
        };
        user.Id = await repo.InsertAsync(user);
        return ToDto(user);
    }

    public async Task<UserDto> UpdateAsync(Actor actor, int id, UpdateUserRequest request)
    {
        var user = await repo.GetByIdAsync(id) ?? throw new NotFoundException();
        var username = ValidateUsername(request.Username);
        ValidateRole(request.Role);

        // Både den nuværende og den nye rolle skal være inden for aktørens rettigheder,
        // så en superuser hverken kan redigere en admin eller forfremme nogen.
        EnsureCanManage(actor, user.Role);
        EnsureCanManage(actor, request.Role);

        if (username != user.Username && await repo.GetByUsernameAsync(username) is not null)
            throw new ConflictException("Username already exists");

        user.Username = username;
        user.Role = request.Role;
        if (request.Password is not null)
        {
            ValidatePassword(request.Password);
            user.PasswordHash = hasher.Hash(request.Password);
        }

        await repo.UpdateAsync(user);
        return ToDto(user);
    }

    public async Task DeleteAsync(Actor actor, int id)
    {
        var user = await repo.GetByIdAsync(id) ?? throw new NotFoundException();
        EnsureCanManage(actor, user.Role);
        if (actor.Id == id) throw new ForbiddenException("You cannot delete yourself");
        await repo.DeleteAsync(id);
    }

    // admin: alle roller. superuser: kun brugere med rollen "user". user: ingen.
    private static void EnsureCanManage(Actor actor, string targetRole)
    {
        var allowed = actor.Role == Roles.Admin
                      || (actor.Role == Roles.SuperUser && targetRole == Roles.User);
        if (!allowed) throw new ForbiddenException();
    }

    private static string Normalize(string username) => username.Trim().ToLowerInvariant();

    private static string ValidateUsername(string? username)
    {
        var normalized = Normalize(username ?? "");
        if (normalized.Length is < 3 or > 50)
            throw new InvalidInputException("Username must be 3-50 characters");
        return normalized;
    }

    private static void ValidateRole(string? role)
    {
        if (role is null || !Roles.All.Contains(role))
            throw new InvalidInputException("Invalid role");
    }

    private static void ValidatePassword(string? password)
    {
        if (password is null || password.Length < MinPasswordLength || password.Length > MaxPasswordLength)
            throw new InvalidInputException(
                $"Password must be {MinPasswordLength}-{MaxPasswordLength} characters");
    }

    private static UserDto ToDto(User u) => new(u.Id, u.Username, u.Role);
}