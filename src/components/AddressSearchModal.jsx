import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export default function AddressSearchModal({ open, onClose, onSelect }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      return;
    }

    if (!window.kakao || !window.kakao.Postcode) {
      console.error("카카오 주소 SDK 로드 안됨");
      return;
    }

    let rafId = 0;
    let cancelled = false;

    const embedPostcode = () => {
      if (cancelled || !containerRef.current) return false;
      containerRef.current.innerHTML = "";
      const postcode = new window.kakao.Postcode({
        oncomplete: function (data) {
          const address = data.roadAddress || data.address;
          if (!window.kakao?.maps?.services?.Geocoder) {
            onSelect({ lat: null, lng: null, address });
            onClose();
            return;
          }

          const geocoder = new window.kakao.maps.services.Geocoder();
          geocoder.addressSearch(address, function (result, status) {
            if (status === window.kakao.maps.services.Status.OK) {
              const lat = Number(result[0].y);
              const lng = Number(result[0].x);
              onSelect({ lat, lng, address });
              onClose();
              return;
            }
            onSelect({ lat: null, lng: null, address });
            onClose();
          });
        },
        width: "100%",
        height: "100%",
      });

      postcode.embed(containerRef.current);
      return true;
    };

    if (!embedPostcode()) {
      rafId = requestAnimationFrame(() => {
        embedPostcode();
      });
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-lg w-[92vw] h-[85vh] p-0 !flex !flex-col overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>주소 검색</DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className="w-full flex-1 min-h-0" />

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
