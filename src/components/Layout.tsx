import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import StickyApplyButton from "./StickyApplyButton";
import AdmissionsBanner from "./AdmissionsBanner";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <AdmissionsBanner />
    <Header />
    <main className="flex-1">{children}</main>
    <Footer />
    <StickyApplyButton />
  </div>
);

export default Layout;
