using System;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Service;

namespace API;

public class JwtTokenService(string key, string issuer, string audience)
{
    public static readonly TimeSpan Lifetime = TimeSpan.FromMinutes(30);

    public (string Token, DateTime Expires) Create(UserDto user)
    {
        var expires = DateTime.UtcNow.Add(Lifetime);
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity([
                new Claim("sub", user.Id.ToString()),
                new Claim("role", user.Role)
            ]),
            Issuer = issuer,
            Audience = audience,
            Expires = expires,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256)
        };
        return (new JsonWebTokenHandler().CreateToken(descriptor), expires);
    }
}