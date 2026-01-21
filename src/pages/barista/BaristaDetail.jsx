import { useParams } from "react-router-dom";

export default function BaristaDetail() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-2xl font-bold mb-2">바리스타 상세</h1>
      <p className="text-gray-600">상세 페이지 준비 중입니다. (ID: {id})</p>
    </div>
  );
}
