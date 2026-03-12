import axios from 'axios';

type ApiErrorData = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function extractApiMessage(data: unknown): string | null {
  if (!data) {
    return null;
  }

  if (typeof data === 'string') {
    return data;
  }

  const payload = data as ApiErrorData;
  if (Array.isArray(payload.message)) {
    return payload.message.join(', ');
  }

  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }

  if (typeof payload.error === 'string' && payload.error.trim().length > 0) {
    return payload.error;
  }

  return null;
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Произошла ошибка. Попробуйте еще раз.',
): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'Сервер долго не отвечает. Попробуйте еще раз.';
    }

    if (!error.response) {
      return 'Нет соединения с сервером. Проверьте сеть и попробуйте снова.';
    }

    const { status, data } = error.response;
    const apiMessage = extractApiMessage(data);
    if (apiMessage) {
      return apiMessage;
    }

    if (status === 401) {
      return 'Сессия истекла. Войдите снова.';
    }

    if (status === 408 || status === 504) {
      return 'Сервер долго не отвечает. Попробуйте еще раз.';
    }

    if (status === 429) {
      return 'Слишком много запросов. Подождите немного.';
    }

    if (status >= 500) {
      return 'Ошибка сервера. Попробуйте позже.';
    }

    return `Ошибка запроса (${status}).`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}
