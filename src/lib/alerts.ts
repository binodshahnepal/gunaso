import Swal, { SweetAlertOptions } from 'sweetalert2';

// Custom hospital-themed SweetAlert configuration
const customSwal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl shadow-2xl border border-slate-100 font-sans',
    title: 'text-slate-900 font-bold tracking-tight',
    htmlContainer: 'text-slate-600 text-sm leading-relaxed',
    confirmButton: 'px-5 py-2.5 rounded-xl font-medium text-white shadow-md focus:outline-none transition-all',
    cancelButton: 'px-5 py-2.5 rounded-xl font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 focus:outline-none transition-all',
  },
  buttonsStyling: true,
  backdrop: 'rgba(15, 23, 42, 0.45)', // dark slate translucent backdrop
});

// Toast notification helper (top-right corner, auto-dismiss)
export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-xl shadow-lg border border-slate-100 bg-white/95 backdrop-blur font-sans text-xs',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export const showToast = (
  title: string,
  icon: 'success' | 'error' | 'warning' | 'info' = 'success'
) => {
  return Toast.fire({
    icon,
    title,
  });
};

export const showSuccessAlert = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  return customSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonColor: '#059669', // Emerald 600
    confirmButtonText: 'Great / ठीक छ',
    ...options,
  });
};

export const showErrorAlert = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  return customSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonColor: '#e11d48', // Rose 600
    confirmButtonText: 'Understood / बुझेँ',
    ...options,
  });
};

export const showWarningAlert = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  return customSwal.fire({
    icon: 'warning',
    title,
    text,
    confirmButtonColor: '#d97706', // Amber 600
    confirmButtonText: 'OK / हुन्छ',
    ...options,
  });
};

export const showInfoAlert = (
  title: string,
  text?: string,
  options?: SweetAlertOptions
) => {
  return customSwal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonColor: '#2563eb', // Blue 600
    confirmButtonText: 'OK / हुन्छ',
    ...options,
  });
};

export const showConfirmDialog = async (
  title: string,
  text: string,
  confirmButtonText = 'Yes, Proceed / अगाडि बढ्नुहोस्',
  cancelButtonText = 'Cancel / रद्द गर्नुहोस्',
  isDanger = false
): Promise<boolean> => {
  const result = await customSwal.fire({
    icon: isDanger ? 'warning' : 'question',
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: isDanger ? '#e11d48' : '#27548b',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export const showDeleteConfirm = async (
  itemName: string,
  extraNotice = 'This action cannot be undone and will permanently remove this item.'
): Promise<boolean> => {
  const result = await customSwal.fire({
    icon: 'warning',
    title: 'Are you sure? / के तपाईं पक्का हुनुहुन्छ?',
    html: `<div class="space-y-2">
      <p class="text-slate-800 font-semibold">Permanently delete: <span class="text-rose-600 font-bold">${itemName}</span>?</p>
      <p class="text-slate-500 text-xs">${extraNotice}</p>
    </div>`,
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    confirmButtonText: 'Yes, Delete / मेटाउनुहोस्',
    cancelButtonText: 'Cancel / रद्द गर्नुहोस्',
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export default customSwal;
