export const geocodeAddress = (address) =>
    new Promise((resolve, reject) => {
      if (!window.kakao?.maps?.services) {
        reject(new Error("카카오 SDK 로드 안 됨"));
        return;
      }
  
      const geocoder = new window.kakao.maps.services.Geocoder();
  
      geocoder.addressSearch(address, (result, status) => {
        if (
          status !== window.kakao.maps.services.Status.OK ||
          !result?.[0]
        ) {
          reject(new Error("주소 좌표 변환 실패"));
          return;
        }
  
        resolve({
          lat: Number(result[0].y),
          lng: Number(result[0].x),
        });
      });
    });
  