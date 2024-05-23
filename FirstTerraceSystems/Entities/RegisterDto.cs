using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Entities
{
    public class RegisterDto
    { 
        [Required(ErrorMessage = "Firstname is required.")]
        public string first_name { get; set; }

        [Required(ErrorMessage = "Lastname is required.")]
        public string last_name { get; set; }

        public string user_id { get; set; } 

        [Required(ErrorMessage = "Email is required.")]
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

        [MinLength(8,ErrorMessage ="Password length must be minimum 8 characters.")]
        [Required(ErrorMessage = "Password is required")]
        public string password { get; set; }

        [Required(ErrorMessage = "Confirm Password is required")]
        [Compare("password", ErrorMessage = "The password and confirm password do not match.")]
        public string confirm_password { get; set; }
    }
}
