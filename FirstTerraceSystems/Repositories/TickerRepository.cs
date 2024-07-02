using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;
using FirstTerraceSystems.Models;
using FirstTerraceSystems.Services;

namespace FirstTerraceSystems.Repositories
{
    public class TickerRepository
    {
        private const int insertbatchSize = 5000;
        const string currentTableName = "tickers";
        private readonly IDbConnection _connection;
        private readonly DatabaseService _databaseService;

        public TickerRepository(IDbConnection connection, DatabaseService databaseService)
        {
            _connection = connection;
            _databaseService = databaseService;
        }

        public bool IsTickerTableExists()
        {
            return _databaseService.IsTableExists(currentTableName);
        }

        public void CreateTableAndIndexes()
        {
            using (var connection = _databaseService.GetNewConnection())
            {
                connection.Execute($"CREATE TABLE IF NOT EXISTS {currentTableName} (" +
                    $"Id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    $"Symbol VARCHAR(255) NOT NULL)");

                connection.Execute($"CREATE INDEX IF NOT EXISTS idx_{currentTableName}_symbol ON {currentTableName}(Symbol)");
            }
        }

        public void InsertRecordsBatch(IEnumerable<NasdaqTicker> batch)
        {
            try
            {
                using (var connection = _databaseService.GetNewConnection())
                {
                    using (var transaction = connection.BeginTransaction())
                    {
                        connection.Execute($"INSERT INTO {currentTableName} (Symbol) VALUES (@Symbol)", batch);

                        transaction.Commit();
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error inserting records: {ex.Message}");
            }
        }
        public void InsertRecords(IEnumerable<NasdaqTicker>? records)
        {
            if (records == null) return;

            CreateTableAndIndexes();

            foreach (var batch in records.Chunk(insertbatchSize))
            {
                InsertRecordsBatch(batch);
            }
        }

        public bool IsTickerExists(string? symbol)
        {
            if (string.IsNullOrEmpty(symbol)) return false;
            try
            {
                string sql = $"SELECT(CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END) AS symbol_exists FROM tickers WHERE symbol = '{symbol}';";
                int result = _connection.ExecuteScalar<int>(sql);
                return result > 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error IsTickerExists : {ex.Message}");
                return false;
            }
        }
    }
}
