import { useState, useCallback } from 'react';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  buttons?: AlertButton[];
}

interface AlertState extends AlertOptions {
  visible: boolean;
}

export const useThemedAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      ...options,
      visible: true,
      buttons: options.buttons || [{ text: 'OK', style: 'default' }],
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, visible: false }));
  }, []);

  return {
    alertState,
    showAlert,
    hideAlert,
  };
};

// Convenience functions for common alert types
export const createThemedAlert = () => {
  const { showAlert } = useThemedAlert();

  return {
    success: (title: string, message: string, buttons?: AlertButton[]) =>
      showAlert({ title, message, type: 'success', buttons }),
    
    error: (title: string, message: string, buttons?: AlertButton[]) =>
      showAlert({ title, message, type: 'error', buttons }),
    
    warning: (title: string, message: string, buttons?: AlertButton[]) =>
      showAlert({ title, message, type: 'warning', buttons }),
    
    info: (title: string, message: string, buttons?: AlertButton[]) =>
      showAlert({ title, message, type: 'info', buttons }),
    
    confirm: (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void,
      confirmText: string = 'Confirm',
      cancelText: string = 'Cancel',
      destructive: boolean = false
    ) =>
      showAlert({
        title,
        message,
        type: destructive ? 'warning' : 'info',
        buttons: [
          { text: cancelText, style: 'cancel', onPress: onCancel },
          { 
            text: confirmText, 
            style: destructive ? 'destructive' : 'default', 
            onPress: onConfirm 
          },
        ],
      }),
  };
};