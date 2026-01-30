import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SplitLayout from "../components/SplitLayout";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { getSupabase } from "../lib/supabase";
import {
  MapPin,
  Clock,
  Search,
  Briefcase,
  Coffee,
  Star,
  SlidersHorizontal,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import ko from "date-fns/locale/ko";
import { motion } from "framer-motion";
import DateFilter from "./filters/DateFilter";
import DetailedFilters from "./filters/DetailedFilters";
import AddressSearchModal from "../components/AddressSearchModal";
import { resolveProfileImageUrl } from "@/lib/profileImage";

const toRad = (value) => (value * Math.PI) / 180;
const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};
const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value) => uuidRegex.test(String(value || ""));

export default function BaristaHome() {
  //state들 
  const [rpcPosts, setRpcPosts] = useState([]);
  const supabase = getSupabase();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [jobPosts, setJobPosts] = useState([]);
  const [cafesById, setCafesById] = useState({});
  const [applications, setApplications] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDetailedFilters, setShowDetailedFilters] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [detailedFilters, setDetailedFilters] = useState({
    maxDistanceKm: 15,
    minWage: 10320,
    maxWage: 20000,
    startTime: null,
    endTime: null,
  });
  const [userLocation, setUserLocation] = useState(null);
// { lat: number, lng: number }

  const [averageRating, setAverageRating] = useState(0);
  const jobPostsById = useMemo(() => {
    const map = {};
    jobPosts.forEach((post) => {
      map[post.id] = post;
    });
    return map;
  }, [jobPosts]);

  //useEffect(fetch data)
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);

      if (!authUser) return;

      const { data: profileRow } = await supabase
        .from("barista_profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      setProfile(profileRow || null);

      const { data: posts } = await supabase
        .from("job_posts")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      setJobPosts(posts || []);

      const cafeIds = (posts || [])
        .map((post) => post.cafe_id)
        .filter((id) => isUuid(id));
      if (cafeIds.length > 0) {
        const { data: cafes } = await supabase
          .from("cafes")
          .select("id, photos")
          .in("id", cafeIds);
        const map = {};
        (cafes || []).forEach((cafe) => {
          map[cafe.id] = cafe;
        });
        setCafesById(map);
      } else {
        setCafesById({});
      }

      const { data: apps } = await supabase
        .from("applications")
        .select("*")
        .eq("barista_email", authUser.email);

      setApplications(apps || []);

      const { data: reviewRows } = await supabase
        .from("reviews")
        .select("rating")
        .eq("barista_email", authUser.email);
      if (reviewRows && reviewRows.length > 0) {
        const sum = reviewRows.reduce(
          (acc, row) => acc + Number(row.rating || 0),
          0
        );
        setAverageRating(Number((sum / reviewRows.length).toFixed(1)));
      } else {
        setAverageRating(0);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (userLocation || jobPosts.length === 0) return;
    if (rpcPosts.length === 0) {
      setRpcPosts(jobPosts);
    }
  }, [userLocation, jobPosts, rpcPosts]);

  useEffect(() => {
    console.log("📍 userLocation", userLocation); // ✅ 수정됨
  }, [userLocation]);
  //추가 거리
  useEffect(() => {
    if (!userLocation) return;

    // 거리 필터 RPC 호출
    const fetchByDistance = async () => {
      const { data, error } = await supabase.rpc(
        "job_posts_within_distance_simple",
        {
          user_lat: userLocation.lat,
          user_lng: userLocation.lng,
          max_distance_km: detailedFilters.maxDistanceKm,
          min_wage: detailedFilters.minWage,
          max_wage: detailedFilters.maxWage,
        }
      );

      if (error) {
        console.error("❌ 거리 RPC 에러:", error);
        setRpcPosts([]);
      } else {
        setRpcPosts(data || []);
      }
    };

    fetchByDistance();
  }, [userLocation, detailedFilters]);

  useEffect(() => {
    console.log("✅ rpcPosts", rpcPosts); // ✅ 수정됨
  }, [rpcPosts]);

  useEffect(() => {
    if (!profile?.profile_photo) {
      setProfilePhotoUrl(null);
      return;
    }

    const imageUrl = resolveProfileImageUrl(supabase, profile.profile_photo);
    setProfilePhotoUrl(imageUrl || null);
  }, [profile?.profile_photo]);

  const appliedPostIds = useMemo(
    () =>
      applications
        .map((application) => application.job_post_id)
        .filter(Boolean),
    [applications]
  );

  const mergedPosts = useMemo(() => {
    return rpcPosts.map((post) => {
      const fullPost = jobPostsById[post.id];
      if (!fullPost) return post;
      return {
        ...fullPost,
        distance_km: post.distance_km ?? fullPost.distance_km,
      };
    });
  }, [rpcPosts, jobPostsById]);

  const filteredPosts = useMemo(() => {
    let result = mergedPosts; //⭐️ 반드시 rpcPosts 기준
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((post) => {
        return (
          post.cafe_name?.toLowerCase().includes(query) ||
          post.cafe_address?.toLowerCase().includes(query) ||
          post.required_skills?.some((skill) =>
            skill.toLowerCase().includes(query)
          )
        );
      });
    }

    if (selectedDate) {
      result = result.filter((post) => {
        const dateValue = post.work_start_date || post.work_end_date;
        if (!dateValue) return false;
        return isSameDay(new Date(dateValue), selectedDate);
      });
    }

    const maxDistance =
      typeof detailedFilters.maxDistanceKm === "number"
        ? detailedFilters.maxDistanceKm
        : 15;

    const minWage = detailedFilters.minWage;
    const maxWage = detailedFilters.maxWage;
    if (minWage) {
      result = result.filter((post) => {
        if (post.work_period_type === "long-term") return true;
        const wage = post.hourly_wage ?? 0;
        const hasUpperBound = maxWage != null && maxWage < 20000;
        return wage >= minWage && (!hasUpperBound || wage <= maxWage);
      });
    }

    if (detailedFilters.startTime) {
      result = result.filter((post) => {
        if (!post.start_time) return true;
        return post.start_time >= detailedFilters.startTime;
      });
    }

    if (detailedFilters.endTime) {
      result = result.filter((post) => {
        if (!post.end_time) return true;
        return post.end_time <= detailedFilters.endTime;
      });
    }

    return result;
  }, [mergedPosts, searchQuery, selectedDate, detailedFilters, profile]); // ✅ 수정됨

  const getCafeImage = (post) => {
    try {
      const cafe = cafesById[post.cafe_id];
      const photos = cafe?.photos;
      if (photos) {
        if (Array.isArray(photos)) {
          const first = photos[0];
          if (typeof first === "string") return first;
          return first?.url || first?.publicUrl || null;
        }
        if (typeof photos === "string") return photos;
        if (typeof photos === "object") {
          if (Array.isArray(photos.urls)) return photos.urls[0] || null;
          return photos.url || photos.publicUrl || null;
        }
      }

      const fallbackPhotos = post.cafe_photos;
      if (Array.isArray(fallbackPhotos)) {
        return fallbackPhotos[0] || null;
      }
      if (typeof fallbackPhotos === "string") return fallbackPhotos;
      return null;
    } catch (error) {
      console.warn("cafe image resolve failed:", error); // ✅ 수정됨
      return null; // ✅ 수정됨
    }
  };

  return (
    <SplitLayout
      leftContent={
        <div className="p-12">
          <img
            src="/images/main_illust.png"
            alt="Barista Visual"
            className="w-full max-w-md mx-auto"
          />
        </div>
      }
      rightContent={
        <div className="min-h-screen bg-gray-50">
          <div className="hidden md:block bg-white px-4 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  안녕하세요 👋
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {profile?.name || user?.email}님
                </p>
              </div>
              <Link to="/barista/baristamypage">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#1FBECC]/10 flex items-center justify-center">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt=""
                      loading="eager"
                      fetchpriority="high"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Coffee className="w-5 h-5 text-[#1FBECC]" />
                  )}
                </div>
              </Link>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="카페명, 지역, 스킬로 검색"
                className="pl-10 h-12 rounded-xl bg-gray-50 border-0"
              />
            </div>
          </div>

          <div className="md:hidden bg-white border-b border-gray-100">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">사이드잡 공고</h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="카페명, 지역, 스킬로 검색"
                  className="pl-9 h-9 bg-gray-50 border-0"
                />
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex gap-3">
              <Link to="/barista/applications" className="flex-1">
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1FBECC]/10 flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-[#1FBECC]" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {applications.length}
                      </p>
                      <p className="text-xs text-gray-500">지원 현황</p>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {averageRating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">평균 평점</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              {rpcPosts.map((post) => {
                const displayPost = jobPostsById[post.id] || post;
                return (
                  <div
                    key={post.id}
                    className="p-3 border rounded-lg text-sm"
                  >
                    <div className="font-semibold">{displayPost.cafe_name}</div>
                    <div className="text-gray-500">
                      거리: {post.distance_km} km
                    </div>
                  </div>
                );
              })}
            </div>


            {/* Filters */}
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => setShowAddressModal(true)}
              >
                주소로 거리 설정
              </Button>
              {/* Date Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-900">
                    날짜 선택
                  </p>
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      초기화
                    </button>
                  )}
                </div>
                <DateFilter
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  jobPosts={mergedPosts}
                />
              </div>

              {/* Detailed Filters Button */}
              <Button
                onClick={() => setShowDetailedFilters(true)}
                variant="outline"
                className="w-full h-12 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#1FBECC] hover:bg-[#1FBECC]/5"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                상세 필터
              </Button>
            </div>

            <DetailedFilters
              open={showDetailedFilters}
              onOpenChange={setShowDetailedFilters}
              filters={detailedFilters}
              onApply={setDetailedFilters}
            />
            <AddressSearchModal
              open={showAddressModal}
              onClose={() => setShowAddressModal(false)}
              onSelect={(location) => {
                setUserLocation({
                  lat: location.lat,
                  lng: location.lng,
                });
              }}
            />

            <div>
              <h2 className="font-semibold text-gray-900 mb-3">
                공고 {filteredPosts.length}건
              </h2>

              {filteredPosts.length === 0 ? ( // ✅ 수정됨
                <div className="bg-white rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">등록된 공고가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post, index) => {
                    const displayPost = jobPostsById[post.id] || post;
                    return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link to={`/barista/baristadetail/${post.id}`}>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                          {getCafeImage(displayPost) ? (
                            <div className="h-32 overflow-hidden">
                              <img
                                src={getCafeImage(displayPost)}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-32 bg-gray-100 flex items-center justify-center">
                              <Coffee className="w-6 h-6 text-gray-300" />
                            </div>
                          )}

                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-gray-900">
                                    {displayPost.cafe_name}
                                  </h3>
                                  {appliedPostIds.includes(post.id) && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                                      지원완료
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span className="truncate max-w-[200px]">
                                    {displayPost.cafe_address}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-[#1FBECC]">
                                  {displayPost.work_period_type === "long-term"
                                    ? `${displayPost.monthly_salary?.toLocaleString()}원`
                                    : `${displayPost.hourly_wage?.toLocaleString()}원`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {displayPost.work_period_type === "long-term"
                                    ? "월급"
                                    : "시급"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {displayPost.work_start_date && displayPost.work_end_date
                                  ? `${format(
                                      new Date(displayPost.work_start_date),
                                      "M/d (E)",
                                      { locale: ko }
                                    )} ~ ${format(
                                      new Date(displayPost.work_end_date),
                                      "M/d (E)",
                                      { locale: ko }
                                    )}`
                                  : "일정 미정"}
                              </span>
                              <span>
                                {displayPost.start_time} - {displayPost.end_time}
                              </span>
                            </div>

                            {displayPost.required_skills?.length > 0 && (
                              <div className="flex gap-1.5 flex-wrap">
                                {displayPost.required_skills.map((skill) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-xs bg-gray-100"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}
