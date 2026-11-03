namespace Infra;

public static class Roles
{
    public const string User = "user";
    public const string SuperUser = "superuser";
    public const string Admin = "admin";

    public static readonly string[] All = [User, SuperUser, Admin];
}