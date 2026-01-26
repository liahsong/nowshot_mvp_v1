import { useEffect, useMemo, useState } from "react";
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

const DISTANCE_MIN = 1;
const DISTANCE_MAX = 15;
const DEFAULT_DISTANCE = 15;
const WAGE_OPTIONS = [
  10320, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000,
];

const clampNumber = (value, min, max) => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const nearestOption = (value, options) => {
  if (value == null) return options[0];
  return options.reduce((prev, current) =>
    Math.abs(current - value) < Math.abs(prev - value) ? current : prev
  );
};

const normalizeFilters = (incoming) => {
  const fallback = {
    maxDistanceKm: DEFAULT_DISTANCE,
    minWage: WAGE_OPTIONS[0],
    maxWage: WAGE_OPTIONS[WAGE_OPTIONS.length - 1],
    startTime: null,
    endTime: null,
  };

  if (!incoming) return fallback;

  const maxDistanceKm = clampNumber(
    Number(incoming.maxDistanceKm ?? incoming.distance ?? DEFAULT_DISTANCE),
    DISTANCE_MIN,
    DISTANCE_MAX
  );

  const wageRange = Array.isArray(incoming.hourlyWage)
    ? incoming.hourlyWage
    : [incoming.minWage, incoming.maxWage];
  const normalizedMin = nearestOption(wageRange?.[0], WAGE_OPTIONS);
  const normalizedMax = nearestOption(wageRange?.[1], WAGE_OPTIONS);
  const minWage = Math.min(normalizedMin, normalizedMax);
  const maxWage = Math.max(normalizedMin, normalizedMax);

  return {
    maxDistanceKm,
    minWage,
    maxWage,
    startTime: incoming.startTime ?? null,
    endTime: incoming.endTime ?? null,
  };
};

const formatWageLabel = (value, isMax) => {
  if (value === 10320) return "최저시급";
  if (value === 20000 && isMax) return "20,000원 이상";
  return `${value.toLocaleString()}원`;
};

export default function DetailedFilters({ open, onOpenChange, filters, onApply }) {
  const [localFilters, setLocalFilters] = useState(() =>
    normalizeFilters(filters)
  );

  useEffect(() => {
    setLocalFilters(normalizeFilters(filters));
  }, [filters]);

  const handleApply = () => {
    onApply(normalizeFilters(localFilters));
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters = {
      maxDistanceKm: DEFAULT_DISTANCE,
      minWage: WAGE_OPTIONS[0],
      maxWage: WAGE_OPTIONS[WAGE_OPTIONS.length - 1],
      startTime: null,
      endTime: null,
    };
    setLocalFilters(resetFilters);
  };

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const min of ["00", "30"]) {
      const h = hour.toString().padStart(2, "0");
      timeOptions.push(`${h}:${min}`);
    }
  }

  const wageRangeIndex = useMemo(() => {
    const minIndex = WAGE_OPTIONS.indexOf(
      nearestOption(localFilters.minWage, WAGE_OPTIONS)
    );
    const maxIndex = WAGE_OPTIONS.indexOf(
      nearestOption(localFilters.maxWage, WAGE_OPTIONS)
    );
    return [Math.min(minIndex, maxIndex), Math.max(minIndex, maxIndex)];
  }, [localFilters.minWage, localFilters.maxWage]);

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
            <p className="text-sm font-semibold text-gray-900 mb-3">
              내 위치 {localFilters.minDistanceKm}km 까지의 공고
            </p>
            <Slider
              dir="rtl"
              value={[localFilters.maxDistanceKm ?? DEFAULT_DISTANCE]}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  maxDistanceKm: clampNumber(
                    Number(value?.[0] ?? DEFAULT_DISTANCE),
                    DISTANCE_MIN,
                    DISTANCE_MAX
                  ),
                })
              }
              min={DISTANCE_MIN}
              max={DISTANCE_MAX}
              step={1}
              className="mb-3"
            />
            <div className="flex justify-between text-sm font-semibold text-gray-900">
              <span>1km</span>
              <span>20km</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[#1FBECC]" />
              <Label className="text-sm font-semibold">시급</Label>
            </div>
            <Slider
              value={wageRangeIndex}
              onValueChange={(value) => {
                const safeValue = Array.isArray(value) ? value : [];
                const minIndex = clampNumber(
                  Number(safeValue[0]),
                  0,
                  WAGE_OPTIONS.length - 1
                );
                const maxIndex = clampNumber(
                  Number(safeValue[1]),
                  0,
                  WAGE_OPTIONS.length - 1
                );
                const nextMin = WAGE_OPTIONS[Math.min(minIndex, maxIndex)];
                const nextMax = WAGE_OPTIONS[Math.max(minIndex, maxIndex)];
                setLocalFilters({
                  ...localFilters,
                  minWage: nextMin,
                  maxWage: nextMax,
                });
              }}
              min={0}
              max={WAGE_OPTIONS.length - 1}
              step={1}
              className="mb-3"
            />
            <div className="flex justify-between text-sm font-semibold text-[#1FBECC]">
              <span>{formatWageLabel(localFilters.minWage, false)}</span>
              <span>{formatWageLabel(localFilters.maxWage, true)}</span>
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
