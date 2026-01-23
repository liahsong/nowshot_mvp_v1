import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit2, Loader2, Plus, Store, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SplitLayout from "../../components/SplitLayout";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import PhotoUploader from "../../components/ui/PhotoUploader";
import { getSupabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "../../components/ui/use-toast";

const CAFE_TYPES = ["개인카페", "프랜차이즈", "로스터리", "베이커리"];
const BUCKETS = { cafe: "cafe_photos" };

const uploadFile = async (supabase, bucket, cafeId, file, folder) => {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${cafeId}/${folder}/${Date.now()}_${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

const normalizeCafePhotos = (photos) => {
  if (!photos) return [];
  if (Array.isArray(photos)) {
    return photos
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return item;
        if (typeof item === "object") {
          return item.url || item.publicUrl || null;
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof photos === "string") return [photos];
  if (typeof photos === "object") {
    if (Array.isArray(photos.urls)) return photos.urls.filter(Boolean);
    return [photos.url || photos.publicUrl].filter(Boolean);
  }
  return [];
};

export default function CafeManage() {
  const supabase = getSupabase();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editingCafe, setEditingCafe] = useState(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    cafe_type: "",
    photos: [],
    description: "",
  });

  const { data: cafes = [], isLoading } = useQuery({
    queryKey: ["cafes", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cafes")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from("cafes")
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafes"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const { data, error } = await supabase
        .from("cafes")
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cafes"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from("cafes").delete().eq("id", id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cafes"] }),
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      cafe_type: "",
      photos: [],
      description: "",
    });
    setEditingCafe(null);
    setUploadFailed(false);
    setShowDialog(false);
  };

  const openEditDialog = (cafe) => {
    const urls = normalizeCafePhotos(cafe.photos);
    setEditingCafe(cafe);
    setFormData({
      name: cafe.name || "",
      address: cafe.address || "",
      cafe_type: cafe.cafe_type || "",
      photos: urls.map((url) => ({ previewUrl: url, url })),
      description: cafe.description || "",
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    setUploadFailed(false);

    let targetCafeId = editingCafe?.id ?? null;
    if (!targetCafeId) {
      const { data: newCafe, error: createError } = await supabase
        .from("cafes")
        .insert({
          owner_id: user.id,
          name: formData.name,
          address: formData.address,
          cafe_type: formData.cafe_type || null,
          description: formData.description || null,
          photos: [],
        })
        .select("id")
        .single();
      if (createError) {
        console.error(createError);
        return;
      }
      targetCafeId = newCafe?.id ?? null;
    }

    const photoUrls = [];
    let uploadFailed = false;
    for (const item of formData.photos) {
      if (!item) continue;
      if (item.file) {
        try {
          photoUrls.push(
            await uploadFile(
              supabase,
              BUCKETS.cafe,
              targetCafeId,
              item.file,
              "cafe"
            )
          );
        } catch (err) {
          console.warn("Cafe photo upload failed:", err);
          uploadFailed = true;
        }
        continue;
      }
      if (typeof item === "string") {
        photoUrls.push(item);
        continue;
      }
      if (item.url) {
        photoUrls.push(item.url);
        continue;
      }
      if (item.previewUrl) {
        photoUrls.push(item.previewUrl);
      }
    }

    const payload = {
      owner_id: user.id,
      name: formData.name,
      address: formData.address,
      cafe_type: formData.cafe_type || null,
      description: formData.description || null,
      photos: photoUrls,
    };

    if (uploadFailed) {
      setUploadFailed(true);
      toast({
        title: "사진 업로드 실패",
        description: "일부 사진 업로드에 실패했습니다. 다시 시도해주세요.",
      });
      if (!editingCafe && targetCafeId) {
        await supabase.from("cafes").delete().eq("id", targetCafeId);
      }
      return;
    }

    if (editingCafe) {
      updateMutation.mutate({ id: editingCafe.id, payload });
    } else if (targetCafeId) {
      updateMutation.mutate({ id: targetCafeId, payload });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const canAddCafe = cafes.length < 5;

  const cafeCards = useMemo(
    () =>
      cafes.map((cafe, index) => {
        const photos = normalizeCafePhotos(cafe.photos);
        const cover = photos[0];
        return { cafe, index, cover };
      }),
    [cafes]
  );

  return (
    <SplitLayout
      leftContent={
        <div className="p-12">
          <img
            src="/images/main_illust.png"
            alt="Owner Visual"
            className="w-full max-w-md mx-auto"
          />
        </div>
      }
      rightContent={
        <div className="min-h-screen bg-gray-50">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="font-semibold text-gray-900">카페 관리</h1>
              </div>
              <span className="text-sm text-gray-500">{cafes.length}/5</span>
            </div>
          </div>

          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            {isLoading && (
              <div className="bg-white rounded-2xl p-6 text-center text-sm text-gray-500">
                불러오는 중...
              </div>
            )}

            <AnimatePresence>
              {cafeCards.map(({ cafe, index, cover }) => (
                <motion.div
                  key={cafe.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative bg-white rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex gap-4">
                    {cover ? (
                      <img
                        src={cover}
                        alt=""
                        className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Store className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 pr-12">
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">
                          {cafe.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {cafe.address}
                        </p>
                        {cafe.cafe_type && (
                          <span className="text-xs text-[#1FBECC]">
                            {cafe.cafe_type}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 flex gap-1">
                      <button
                        onClick={() => openEditDialog(cafe)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        aria-label="카페 수정"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cafe)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        aria-label="카페 삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {canAddCafe && (
              <Button
                onClick={() => setShowDialog(true)}
                variant="outline"
                className="w-full h-14 border-2 border-dashed border-gray-300 hover:border-[#1FBECC] rounded-2xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                카페 추가하기
              </Button>
            )}

            {!canAddCafe && (
              <div className="bg-amber-50 rounded-xl p-4 text-center text-sm text-amber-700">
                카페는 최대 5개까지 등록할 수 있습니다.
              </div>
            )}
          </div>

          <Dialog open={showDialog} onOpenChange={(open) => !open && resetForm()}>
            <DialogContent
              overlayClassName="bg-black/40"
              className="rounded-2xl max-h-[90vh] overflow-y-auto bg-white"
            >
              <DialogHeader>
                <DialogTitle>
                  {editingCafe ? "카페 수정" : "카페 추가"}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  카페 정보를 입력하고 사진을 업로드하세요.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>카페명</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="카페 이름을 입력해주세요"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>주소</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="도로명 주소를 입력해주세요"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>카페 타입</Label>
                  <Select
                    value={formData.cafe_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cafe_type: value })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAFE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <PhotoUploader
                  photos={formData.photos}
                  onPhotosChange={(photos) =>
                    setFormData({ ...formData, photos })
                  }
                  maxPhotos={4}
                  label="매장 사진 (최대 4장)"
                />

                <div>
                  <Label>매장 분위기 소개</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="크루와 근무 환경을 소개해주세요"
                    className="mt-1.5 min-h-[80px]"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetForm} className="flex-1">
                  취소
                </Button>
                {uploadFailed && (
                  <Button
                    variant="outline"
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    사진 재시도
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={
                    !formData.name ||
                    !formData.address ||
                    !formData.cafe_type ||
                    isSubmitting
                  }
                  className="flex-1 bg-[#1FBECC] hover:bg-[#1AABB8]"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingCafe ? (
                    "수정하기"
                  ) : (
                    "추가하기"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
          >
            <DialogContent className="rounded-2xl max-w-sm bg-white">
              <DialogHeader>
                <DialogTitle>카페 삭제</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  삭제하면 카페 정보와 사진을 복구할 수 없습니다.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-sm text-gray-600">
                  선택한 카페를 삭제할까요?
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={() => {
                    if (!deleteTarget) return;
                    deleteMutation.mutate(deleteTarget.id, {
                      onSettled: () => setDeleteTarget(null),
                    });
                  }}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "삭제"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    />
  );
}
