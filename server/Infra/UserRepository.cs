using LinqToDB;
using LinqToDB.Async;
using LinqToDB.Data;

namespace Infra;

public class UserRepository(AppDb db)
{
    // UNIQUE og CHECK sikrer integritet i databasen, uanset hvad applikationen gør.
    public async Task EnsureSchemaAsync() =>
        await db.ExecuteAsync("""
                              CREATE TABLE IF NOT EXISTS users (
                                  id SERIAL PRIMARY KEY,
                                  username TEXT NOT NULL UNIQUE,
                                  password_hash TEXT NOT NULL,
                                  role TEXT NOT NULL CHECK (role IN ('user', 'superuser', 'admin'))
                              )
                              """);

    public Task<bool> AnyAsync() => db.Users.AnyAsync();

    public Task<List<User>> GetAllAsync() => db.Users.OrderBy(u => u.Id).ToListAsync();

    public Task<User?> GetByIdAsync(int id) => db.Users.FirstOrDefaultAsync(u => u.Id == id);

    public Task<User?> GetByUsernameAsync(string username) =>
        db.Users.FirstOrDefaultAsync(u => u.Username == username);

    public Task<int> InsertAsync(User user) => db.InsertWithInt32IdentityAsync(user);

    public Task UpdateAsync(User user) => db.UpdateAsync(user);

    public Task DeleteAsync(int id) => db.Users.Where(u => u.Id == id).DeleteAsync();
}