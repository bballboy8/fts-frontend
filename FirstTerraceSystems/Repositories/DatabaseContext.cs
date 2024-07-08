using System.Data;
using Dapper;
using Microsoft.Data.Sqlite;

namespace FirstTerraceSystems.Repositories
{
    public class DatabaseContext
    {

        private readonly string _connectionString;

        public DatabaseContext(string dbPath)
        {
            _connectionString = $"Data Source={dbPath}";
        }

        public IDbConnection CreateConnection()
        {
            return new SqliteConnection(_connectionString);
        }

        public bool IsTableExists(string tableName)
        {
            try
            {
                using (IDbConnection connection = CreateConnection())
                {
                    int result = connection.ExecuteScalar<int>($"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{tableName}'");
                    return result > 0;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking table existence: {ex.Message}");
                return false;
            }
        }
        private void InitializeDatabase() { }
    }
}
