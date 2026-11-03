using LinqToDB.Mapping;

namespace Infra;

[Table("users")]
public class User
{
    [PrimaryKey, Identity, Column("id")]
    public int Id { get; set; }

    [Column("username"), NotNull]
    public string Username { get; set; } = "";

    [Column("password_hash"), NotNull]
    public string PasswordHash { get; set; } = "";

    [Column("role"), NotNull]
    public string Role { get; set; } = Roles.User;
}