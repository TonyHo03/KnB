using LinqToDB;
using LinqToDB.Data;

namespace Infra;

public class AppDb(DataOptions options) : DataConnection(options)
{
    public ITable<User> Users => this.GetTable<User>();
}