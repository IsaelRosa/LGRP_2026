const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function signInWithGoogle() {
  const popup = window.open('/api/auth/google', 'google-auth', isMobile() ? '' : 'width=500,height=600');
  const handler = async (event: MessageEvent) => {
    if (event.origin !== window.location.origin || event.source !== popup) return;
    if (event.data?.type === 'google-auth-error') {
      window.removeEventListener('message', handler);
      console.error('[google-auth]', event.data.error);
      return;
    }
    if (event.data?.type !== 'google-auth-success') return;
    window.removeEventListener('message', handler);
    if (!event.data.access_token) return;
    window.localStorage.setItem('lgrp_access_token', event.data.access_token);
    window.dispatchEvent(new Event('lgrp-auth-change'));
    popup?.close();
  };
  window.addEventListener('message', handler);
}
