using FirstTerraceSystems.Entities.Nasdaq;
using SQLite;

namespace FirstTerraceSystems.Services
{
    public class SqlLiteService
    {
        private SQLiteConnection _connection;

        public SqlLiteService()
        {
            var dbpath = Path.Combine(@"D:\", "FTS.db");
            _connection = new SQLiteConnection(dbpath);
            _connection.CreateTable<SymbolicData>();
        }

        //public IEnumerable<EquitiesBarModal> GetData()
        //{
        //    var result = _connection.Table<EquitiesBarModal>().AsQueryable();
        //    return result;
        //}

        public IEnumerable<dynamic> GetSymbolicData(string symbol)
        {
            var result = _connection.Table<SymbolicData>().Where(x => x.Symbol == symbol)
                .Select(x => new { t = x.TimeStamp, p = x.Price }).ToList();
            return result;
        }

        public void UpdateSymbolicDataToDB(NasdaqData data)
        {
            List<SymbolicData> batch = new();
            foreach (var item in data.Data)
            {
                batch.Add(new SymbolicData(data.Headers, item));
                if (batch.Count > 10000)
                {
                    _connection.InsertAll(batch);
                    batch.Clear();
                }
            }
            if (batch.Count > 0)
                _connection.InsertAll(batch);
        }
    }
}
