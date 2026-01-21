import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, LogOut, Store, User } from "lucide-react";
import { motion } from "framer-motion";
import SplitLayout from "../../components/SplitLayout";
import { Button } from "../../components/ui/button";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function OwnerMyPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getCafeImage = (photos) => {
    if (!photos) return "";
    if (Array.isArray(photos)) {
      const first = photos[0];
      if (typeof first === "string") return first;
      return first?.url || first?.publicUrl || "";
    }
    if (typeof photos === "string") return photos;
    if (typeof photos === "object") {
      if (Array.isArray(photos.urls)) return photos.urls[0] || "";
      return photos.url || photos.publicUrl || "";
    }
    return "";
  };

  const { data: profile } = useQuery({
    queryKey: ["ownerProfile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owner_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
    enabled: !!user?.id,
  });

  const { data: cafes = [] } = useQuery({
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

  const { data: jobPosts = [] } = useQuery({
    queryKey: ["jobPosts", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_posts")
        .select("id, status")
        .eq("owner_email", user.email)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.email,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const menuItems = [
    {
      icon: Store,
      label: "카페 관리",
      path: "/owner/cafes",
      count: cafes.length,
    },
    {
      icon: Store,
      label: "공고 관리",
      path: "/owner/jobs",
      count: jobPosts.length,
    },
    { icon: User, label: "프로필 수정", path: "/owner/profile/edit" },
  ];

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
            <div className="flex items-center gap-4">
              <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="font-semibold text-gray-900">마이페이지</h1>
            </div>
          </div>

          <div className="p-4 space-y-4 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-gray-900">
                    {profile?.owner_name || "사장님"}
                  </h2>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-sm text-gray-500">{profile?.phone}</p>
                </div>
              </div>
            </motion.div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">내 카페</h3>
                <Link to="/owner/cafes" className="text-sm text-[#1FBECC]">
                  카페 관리
                </Link>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                {cafes.slice(0, 3).map((cafe) => {
                  const image = getCafeImage(cafe.photos);
                  return (
                    <div
                      key={cafe.id}
                      className="flex-shrink-0 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                          <Store className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {cafe.name}
                      </span>
                    </div>
                  );
                })}
                {cafes.length > 3 && (
                  <div className="flex-shrink-0 flex items-center px-3 text-sm text-gray-500">
                    +{cafes.length - 3}
                  </div>
                )}
                {cafes.length === 0 && (
                  <div className="text-sm text-gray-500">
                    등록된 카페가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {menuItems.map((item, index) => (
                <Link key={item.path} to={item.path}>
                  <div
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
                      index !== menuItems.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count !== undefined && (
                        <span className="text-sm text-[#1FBECC] font-medium">
                          {item.count}
                        </span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full h-12 text-red-500 border-red-200 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      }
    />
  );
}
