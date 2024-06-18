using FirstTerraceSystems.Entities.Nasdaq;
using SQLite;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Services
{
    public class SqlLiteService
    {
        private SQLiteConnection _connection;

        public SqlLiteService()
        {
            var dbpath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Nasdaq1.db");
            _connection = new SQLiteConnection(dbpath);
            _connection.CreateTable<EquitiesBarModal>();
            _connection.CreateTable<NasdaqSymbolicData>();
        }

        public IEnumerable<EquitiesBarModal> GetData()
        {
            var result = _connection.Table<EquitiesBarModal>().AsQueryable();
            return result;
        }

        public NasdaqSymbolicData GetSymbolicData()
        {
            var result = _connection.Table<NasdaqSymbolicData>().ToList();
            return result.FirstOrDefault();
        }

        public int StoreSymbolicData(string equities)
        {
            return _connection.Insert(new NasdaqSymbolicData
            {
                Data = equities,
            });
        }

        public int Store(IEnumerable<EquitiesBarModal> equities)
        {
            return _connection.InsertAll(equities);
        }

        public void Delete()
        {
            _connection.DeleteAll<EquitiesBarModal>();
        }
    }
}
