import { Outlet } from "react-router-dom";
import GNB from "../components/GNB";

export default function BaristaLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <GNB />
      <Outlet />
    </div>
  );
}
