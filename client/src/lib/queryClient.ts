import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Для случая 404 при удалении объектов - возвращаем сам ответ без ошибки
    if (res.status === 404) {
      return;
    }
    
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        try {
          const data = JSON.parse(text);
          errorMessage = data.message || res.statusText;
        } catch {
          errorMessage = text;
        }
      }
    } catch {
      // Если не можем прочитать текст, используем statusText
    }
    
    throw new Error(errorMessage);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  try {
    const fetchOptions: RequestInit = {
      method: method,
      credentials: "include",
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    };

    // Добавляем тело запроса и заголовок Content-Type для методов с данными
    if (data !== undefined && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      fetchOptions.body = JSON.stringify(data);
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Content-Type': 'application/json'
      };
    }

    const res = await fetch(url, fetchOptions);

    // Специальная обработка для DELETE запросов
    if (method === 'DELETE') {
      // Для успешно удаленных ресурсов
      if (res.status === 204) {
        return { success: true };
      }
      // Для ресурсов, которые не найдены (уже удалены)
      if (res.status === 404) {
        return { success: true, alreadyDeleted: true };
      }
    }

    await throwIfResNotOk(res);
    
    // Для пустых ответов (204 No Content)
    if (res.status === 204) {
      return null;
    }
    
    // Проверяем есть ли содержимое в ответе
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return res.json();
    }
    
    // Для всех остальных случаев возвращаем текст ответа
    return res.text();
  } catch (error) {
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options?: {
  on401?: UnauthorizedBehavior;
}) => QueryFunction<T> =
  (options) =>
  async ({ queryKey }) => {
    const unauthorizedBehavior = options?.on401 || "throw";
    
    // Добавляем время к запросу для обхода кэширования
    const url = queryKey[0] as string;
    const noCacheUrl = url.includes('?') 
      ? `${url}&_nocache=${Date.now()}` 
      : `${url}?_nocache=${Date.now()}`;
    
    const res = await fetch(noCacheUrl, {
      credentials: "include",
      headers: {
        // Добавляем заголовки против кэширования
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      // Отключаем кэширование fetch
      cache: 'no-store'
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      // Настройки кеширования с отключенным длительным кэшированием
      staleTime: 0, // Данные становятся устаревшими сразу после получения
      gcTime: 1000, // Кэш сохраняется только 1 секунду после исчезновения с экрана
      retry: 1, // Одна повторная попытка при ошибке
      refetchOnMount: "always", // Всегда запрашиваем свежие данные при монтировании компонента
    },
    mutations: {
      retry: false,
    },
  },
});
