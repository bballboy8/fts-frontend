using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Models
{
    public class RegisterModel
    {
        public int Id { get; set; }
        public string first_name { get; set; }
        public string last_name { get; set; }
        public string user_id { get; set; }
        public string email { get; set; }
        public string company_name { get; set; }
        public string phone { get; set; }
        public string address_1 { get; set; }
        public string address_2 { get; set; }
        public string city { get; set; }
        public string state { get; set; }
        public string region { get; set; }
        public string postal_code { get; set; }
        public string country { get; set; }
        public string password { get; set; }
        public string confirm_password { get; set; }
        public TradingExperience trading_experience { get; set; }
    }

    public class TradingExperience
    {
        public string question_1 { get; set; }
        public string question_2 { get; set; }
        public string question_3 { get; set; }
        public string question_4 { get; set; }
        public string question_5 { get; set; }
        public string question_6 { get; set; }
        public string question_7 { get; set; }
        public string question_8 { get; set; }
        public string question_9 { get; set; }
    }

}
