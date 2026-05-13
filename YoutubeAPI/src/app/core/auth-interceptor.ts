import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('google_access_token');

  const isYoutube = req.url.includes('googleapis.com/youtube');
  const hasKey = req.params.has('key') || req.url.includes('key=');
  const isMine = req.url.includes('mine=true');

  if (token && isYoutube && (isMine || !hasKey)) {
    console.log(`[AuthInterceptor] Adding token to request: ${req.url}`);
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  } else if (isYoutube && isMine) {
    console.warn(`[AuthInterceptor] Missing token for "mine=true" request! URL: ${req.url}`);
  }


  return next(req);
};
