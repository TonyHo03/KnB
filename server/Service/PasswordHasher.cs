using Isopoh.Cryptography.Argon2;

namespace Service;

public class PasswordHasher
{
    // Argon2id; parametrene ligger over OWASP's minimum (m=19 MiB, t=2, p=1).
    private const int TimeCost = 3;
    private const int MemoryCostKiB = 65536;
    private const int Parallelism = 1;

    // Bruges ved ukendt brugernavn, så svartiden ikke afslører om brugeren findes.
    public string DummyHash { get; }

    public PasswordHasher() => DummyHash = Hash("dummy-password-for-timing");

    // Biblioteket genererer et tilfældigt salt pr. kald og lægger det i den returnerede streng.
    public string Hash(string password) =>
        Argon2.Hash(password, timeCost: TimeCost, memoryCost: MemoryCostKiB,
            parallelism: Parallelism, type: Argon2Type.HybridAddressing);

    public bool Verify(string hash, string password) => Argon2.Verify(hash, password);
}