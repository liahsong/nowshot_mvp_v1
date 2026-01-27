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

    const postcode = new window.kakao.Postcode({
      oncomplete: function (data) {
        const geocoder = new window.kakao.maps.services.Geocoder();

        geocoder.addressSearch(data.address, function (result, status) {
          if (status === window.kakao.maps.services.Status.OK) {
            const lat = Number(result[0].y);
            const lng = Number(result[0].x);

            onSelect({ lat, lng, address: data.address });
            onClose();
          }
        });
      },
      width: "100%",
      height: "100%",
    });

    postcode.embed(containerRef.current);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="max-w-lg h-[500px] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle>주소 검색</DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className="w-full h-full" />

        <div className="p-4 border-t">
          <Button variant="outline" className="w-full" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
