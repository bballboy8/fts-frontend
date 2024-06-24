using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FirstTerraceSystems.Entities;
using FirstTerraceSystems.Repositories;
using SQLite;

namespace FirstTerraceSystems.Services
{
    internal class DatabaseService : IDisposable
    {
        private readonly SQLiteConnection _connection;

        public SymbolicRepository SymbolicRepository { get; }

        public DatabaseService(string dbPath)
        {
            _connection = new SQLiteConnection(dbPath);
            InitializeDatabase();

            SymbolicRepository = new SymbolicRepository(_connection);
        }

        private void InitializeDatabase()
        {
            _connection.CreateTable<SymbolicData>();
            //_database.CreateTable<EquitiesBar>();
        }

        public void Dispose()
        {
            _connection?.Close();
        }
    }
}
