import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Slider } from "../../components/ui/slider";
import { Label } from "../../components/ui/label";
import { MapPin, DollarSign, Clock } from "lucide-react";

export default function DetailedFilters({ open, onOpenChange, filters, onApply }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters = {
      distance: 15,
      hourlyWage: [10320, 25000],
      startTime: null,
      endTime: null,
    };
    setLocalFilters(resetFilters);
    onApply(resetFilters);
  };

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const min of ["00", "30"]) {
      const h = hour.toString().padStart(2, "0");
      timeOptions.push(`${h}:${min}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">상세 필터</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-[#1FBECC]" />
              <Label className="text-sm font-semibold">거리</Label>
            </div>
            <Slider
              dir="rtl"
              value={[localFilters.distance ?? 15]}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, distance: value[0] })
              }
              min={1}
              max={15}
              step={1}
              className="mb-3"
            />
            <div className="flex justify-end text-sm font-semibold text-gray-900">
              <span>{localFilters.distance ?? 15}km 이내</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[#1FBECC]" />
              <Label className="text-sm font-semibold">시급</Label>
            </div>
            <Slider
              value={localFilters.hourlyWage}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, hourlyWage: value })
              }
              min={10320}
              max={25000}
              step={1000}
              className="mb-3"
            />
            <div className="flex justify-between text-sm font-semibold text-[#1FBECC]">
              <span>{localFilters.hourlyWage[0].toLocaleString()}원</span>
              <span>{localFilters.hourlyWage[1].toLocaleString()}원</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#1FBECC]" />
              <Label className="text-sm font-semibold">근무시간</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  시작시간
                </label>
                <select
                  value={localFilters.startTime || ""}
                  onChange={(event) =>
                    setLocalFilters({
                      ...localFilters,
                      startTime: event.target.value || null,
                    })
                  }
                  className="w-full h-11 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium focus:border-[#1FBECC] focus:outline-none"
                >
                  <option value="">선택</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-2 block">
                  종료시간
                </label>
                <select
                  value={localFilters.endTime || ""}
                  onChange={(event) =>
                    setLocalFilters({
                      ...localFilters,
                      endTime: event.target.value || null,
                    })
                  }
                  className="w-full h-11 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium focus:border-[#1FBECC] focus:outline-none"
                >
                  <option value="">선택</option>
                  {timeOptions.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleReset}
            variant="outline"
            className="flex-1 h-12 rounded-xl font-semibold"
          >
            초기화
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 h-12 rounded-xl bg-[#1FBECC] hover:bg-[#1AABB8] font-semibold"
          >
            적용하기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
