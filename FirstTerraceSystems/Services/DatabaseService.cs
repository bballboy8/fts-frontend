using System.Data;
using Dapper;
using FirstTerraceSystems.Repositories;
using Microsoft.Data.Sqlite;

namespace FirstTerraceSystems.Services
{
    public class DatabaseService : IDisposable
    {

        private readonly IDbConnection _connection;

        public SymbolicRepository SymbolicRepository { get; }
        public TickerRepository TickerRepository { get; }

        public DatabaseService(string dbPath)
        {
            _connection = new SqliteConnection($"Data Source={dbPath}");
            _connection.Open();
            SymbolicRepository = new SymbolicRepository(_connection, this);
            TickerRepository = new TickerRepository(_connection, this);
        }

        public IDbConnection GetNewConnection()
        {
            var connection = new SqliteConnection(_connection.ConnectionString);
            connection.Open();
            return connection;
        }

        public bool IsTableExists(string tableName)
        {
            try
            {
                int result = _connection.ExecuteScalar<int>($"SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='{tableName}'");
                return result > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error checking table existence: {ex.Message}");
                return false;
            }
        }

        public void Dispose()
        {
            _connection?.Close();
            _connection?.Dispose();
        }

        private void InitializeDatabase() { }
    }
}
