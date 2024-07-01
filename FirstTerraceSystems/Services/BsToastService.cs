using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BlazorBootstrap;

namespace FirstTerraceSystems.Services
{
    public class BsToastService
    {
        private readonly ToastService _toastService;

        public BsToastService(ToastService toastService)
        {
            _toastService = toastService;
        }

        public void ShowSuccessMessage(string message, bool autoHide = true)
        {
            var toastMessage = new ToastMessage { Type = ToastType.Success, Message = message, AutoHide = autoHide };
            _toastService.Notify(toastMessage);
        }

        public void ShowWarningMessage(string message, bool autoHide = true)
        {
            var toastMessage = new ToastMessage { Type = ToastType.Warning, Message = message, AutoHide = true };
            _toastService.Notify(toastMessage);
        }

        public void ShowDangerMessage(string message, bool autoHide = true)
        {
            var toastMessage = new ToastMessage { Type = ToastType.Danger, Message = message, AutoHide = autoHide };
            _toastService.Notify(toastMessage);
        }
    }
}
