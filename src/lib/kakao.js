const sdkId = "kakao-maps-sdk";

export const loadKakaoSdk = () =>
  new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window not available."));
      return;
    }

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    const existing = document.getElementById(sdkId);
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.kakao?.maps?.load) {
          window.kakao.maps.load(() => resolve());
          return;
        }
        resolve();
      });
      existing.addEventListener("error", () =>
        reject(new Error("Kakao SDK load failed."))
      );
      return;
    }

    const key = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!key) {
      reject(new Error("Missing VITE_KAKAO_JS_KEY."));
      return;
    }

    const script = document.createElement("script");
    script.id = sdkId;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services&autoload=false`;
    script.onload = () => {
      if (window.kakao?.maps?.load) {
        window.kakao.maps.load(() => resolve());
        return;
      }
      resolve();
    };
    script.onerror = () => reject(new Error("Kakao SDK load failed."));
    document.head.appendChild(script);
  });

export const geocodeAddress = (address) =>
  new Promise((resolve, reject) => {
    if (!window.kakao?.maps?.services) {
      reject(new Error("Kakao services not available."));
      return;
    }
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result, status) => {
      if (
        status !== window.kakao.maps.services.Status.OK ||
        !result?.[0]
      ) {
        reject(new Error("Geocode failed."));
        return;
      }
      resolve({ lat: Number(result[0].y), lng: Number(result[0].x) });
    });
  });
