import React from "react";
import {
  Menu,
  Search,
  Calendar,
  CreditCard,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  ChevronDown,
  X,
  Mic,
} from "lucide-react";

// --- Defining Colors based on the screenshot analysis ---
// These colors are used via inline styles or hex codes in className to ensure accuracy.
const COLORS = {
  darkBg: "#1C1C1C", // Main background color
  cardBg: "#282828", // Card background color
  accentRed: "#E94F4F", // The dominant red/orange accent color
  textLight: "#F5F5F5", // Light text (headings, values)
  textMuted: "#A0A0A0", // Muted text (details, labels)
};

// --- Reusable Components ---

const Card = ({ children, className = "" }) => (
  <div
    style={{ backgroundColor: COLORS.cardBg }}
    className={`p-6 rounded-2xl shadow-xl ${className}`}
  >
    {children}
  </div>
);

const IconButton = ({ icon: Icon, className = "", onClick }) => (
  <button
    className={`p-2 rounded-full hover:opacity-80 transition-opacity text-white ${className}`}
    onClick={onClick}
  >
    <Icon size={20} />
  </button>
);

const StatCard = ({ title, value, weekly }) => (
  <Card className="flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <p style={{ color: COLORS.textMuted }} className="text-sm">
        {title}
      </p>
      {/* Note: The "Weekly" button in the image is a gray box with a white border and white text. */}
      {weekly && (
        <p
          style={{ borderColor: COLORS.textMuted, color: COLORS.textLight }}
          className="text-sm border border-opacity-30 rounded-full px-2 py-0.5"
        >
          Weekly
        </p>
      )}
    </div>
    <p style={{ color: COLORS.textLight }} className="text-2xl font-bold mt-2">
      {value}
    </p>
  </Card>
);

// --- Complex Section Mockups ---

const AnnualProfitsChart = () => (
  <Card className="flex flex-col h-full">
    <div className="flex justify-between items-center text-white">
      <p className="font-semibold">Annual profits</p>
      <div
        style={{ color: COLORS.textMuted }}
        className="flex items-center space-x-2 text-sm"
      >
        <p>2023</p>
        <ChevronDown size={14} />
      </div>
    </div>
    <div className="flex-1 flex items-center justify-center p-4">
      {/* Concentric circles chart mockup */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* The opacity levels (1A, 33, 4D, 66) are approximations for the visual depth */}
        <div
          style={{ backgroundColor: `${COLORS.accentRed}1A` }}
          className="absolute rounded-full w-48 h-48 flex items-center justify-center"
        >
          <div
            style={{ backgroundColor: `${COLORS.accentRed}33` }}
            className="rounded-full w-36 h-36 flex items-center justify-center"
          >
            <div
              style={{ backgroundColor: `${COLORS.accentRed}4D` }}
              className="rounded-full w-24 h-24 flex items-center justify-center"
            >
              <div
                style={{ backgroundColor: `${COLORS.accentRed}66` }}
                className="rounded-full w-12 h-12"
              ></div>
            </div>
          </div>
        </div>
        {/* Labels positioned over the circles */}
        <div className="absolute top-1 left-2 text-white text-sm font-semibold">
          $14K
        </div>
        <div className="absolute top-16 right-0 text-white text-sm font-semibold">
          $9.3K
        </div>
        <div className="absolute bottom-16 right-0 text-white text-sm font-semibold">
          $6.8K
        </div>
        <div className="absolute bottom-1 left-4 text-white text-sm font-semibold">
          $4K
        </div>
      </div>
    </div>
  </Card>
);

const MainStocks = () => (
  <Card className="flex flex-col justify-between">
    {/* Stock Value */}
    <div className="flex justify-end text-white mb-4">
      <span className="text-2xl font-bold">$16,073.49</span>
    </div>
    {/* Stock Label */}
    <p className="text-sm font-semibold text-white">Main Stocks</p>
    <div className="flex justify-between items-end mt-1">
      <p style={{ color: COLORS.textMuted }} className="text-xs">
        Extended & Limited
      </p>
      {/* The +9.3% is green in the image */}
      <span className="text-green-500 flex items-center text-sm font-medium">
        <TrendingUp size={16} />
        +9.3%
      </span>
    </div>
    {/* Simple line graph mockup */}
    <div className="h-16 bg-gray-700 rounded mt-4 opacity-50"></div>
  </Card>
);

const ActivityManager = () => (
  <Card className="flex flex-col h-full">
    <div className="flex justify-between items-center mb-4">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search in activities..."
        style={{ backgroundColor: COLORS.darkBg, color: COLORS.textLight }}
        className="p-2 rounded-lg w-full mr-4 border border-transparent focus:border-white/20 transition-colors"
      />
      {/* Filter Buttons */}
      <div className="flex space-x-2 text-white">
        <button
          style={{ backgroundColor: COLORS.accentRed }}
          className="px-3 py-1 rounded-full text-sm font-medium"
        >
          Team
        </button>
        <button
          style={{ backgroundColor: COLORS.darkBg, color: COLORS.textMuted }}
          className="px-3 py-1 rounded-full text-sm border border-transparent"
        >
          Insights
        </button>
        <button
          style={{ backgroundColor: COLORS.darkBg, color: COLORS.textMuted }}
          className="px-3 py-1 rounded-full text-sm border border-transparent"
        >
          Today
        </button>
        {/* The actual image uses small icons for filters */}
        <IconButton
          icon={X}
          style={{ backgroundColor: COLORS.darkBg, color: COLORS.textMuted }}
        />
        <IconButton
          icon={ChevronDown}
          style={{ backgroundColor: COLORS.darkBg, color: COLORS.textMuted }}
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4 flex-1">
      {/* Left: Bar Chart Mockup */}
      <div className="flex flex-col">
        <p className="text-3xl font-bold text-white">
          $43.20
          <span
            className="text-sm font-normal ml-1"
            style={{ color: COLORS.textMuted }}
          >
            USD
          </span>
        </p>
        {/* Bar chart visualization */}
        <div className="flex space-x-1 mt-4 h-24 items-end">
          <div
            style={{ backgroundColor: COLORS.accentRed }}
            className="w-1/5 h-full rounded-t-full"
          ></div>
          <div
            style={{ backgroundColor: COLORS.textMuted }}
            className="w-1/5 h-2/3 rounded-t-full opacity-50"
          ></div>
          <div
            style={{ backgroundColor: COLORS.textMuted }}
            className="w-1/5 h-1/2 rounded-t-full opacity-50"
          ></div>
          <div
            style={{ backgroundColor: COLORS.accentRed }}
            className="w-1/5 h-5/6 rounded-t-full"
          ></div>
          <div
            style={{ backgroundColor: COLORS.textMuted }}
            className="w-1/5 h-1/3 rounded-t-full opacity-50"
          ></div>
        </div>
      </div>

      {/* Right: Business Plans & Wallet Verification */}
      <div className="space-y-4">
        <div className="text-white">
          <p className="font-semibold mb-2">Business plans</p>
          <div className="space-y-1 text-sm">
            {/* The icons are the accent color */}
            <div className="flex items-center">
              <DollarSign
                size={14}
                style={{ color: COLORS.accentRed }}
                className="mr-2"
              />
              Bank loans
            </div>
            <div className="flex items-center">
              <Briefcase
                size={14}
                style={{ color: COLORS.accentRed }}
                className="mr-2"
              />
              Accounting
            </div>
            <div className="flex items-center">
              <Users
                size={14}
                style={{ color: COLORS.accentRed }}
                className="mr-2"
              />
              HR/management
            </div>
          </div>
        </div>

        {/* Wallet Verification Card */}
        <div
          style={{
            backgroundColor: COLORS.darkBg,
            borderColor: COLORS.accentRed,
          }}
          className="p-4 rounded-xl text-white border border-opacity-30"
        >
          <p className="text-sm font-semibold mb-2">Wallet Verification</p>
          <p style={{ color: COLORS.textMuted }} className="text-xs mb-3">
            Enable 2-step verification to secure all your assets.
          </p>
          <button
            style={{ backgroundColor: COLORS.accentRed }}
            className="px-4 py-1.5 rounded-xl text-sm font-medium hover:opacity-90 transition-colors"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  </Card>
);

// --- Main Dashboard Component ---

const Dashboard1 = () => {
  return (
    <div
      style={{ backgroundColor: COLORS.darkBg, color: COLORS.textLight }}
      className="min-h-screen p-8 font-sans"
    >
      {/* --- 1. Header Section --- */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center space-x-6">
          <IconButton icon={Menu} />
          <h1 className="text-2xl font-bold flex items-center">
            <span
              style={{ backgroundColor: COLORS.accentRed }}
              className="rounded-full text-lg w-8 h-8 flex items-center justify-center mr-2"
            >
              Nº
            </span>
            Financial Dashboard
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {/* Search Icon */}
          <div
            style={{ borderColor: COLORS.textMuted }}
            className="p-2 rounded-lg border border-opacity-50 text-white"
          >
            <Search size={20} />
          </div>
          {/* User Profile */}
          <div
            style={{ backgroundColor: COLORS.cardBg }}
            className="flex items-center p-2 rounded-full"
          >
            <div className="w-10 h-10 bg-gray-500 rounded-full mr-3"></div>{" "}
            {/* Placeholder for Avatar */}
            <div>
              <p className="font-semibold text-sm">Dwayne Tatum</p>
              <p style={{ color: COLORS.textMuted }} className="text-xs">
                CEO Assistant
              </p>
            </div>
          </div>
          {/* Search Input on the right */}
          <input
            type="text"
            placeholder="Start searching here..."
            style={{ backgroundColor: COLORS.darkBg, color: COLORS.textMuted }}
            className="p-2 rounded-lg w-48 border border-transparent focus:border-white/20 transition-colors"
          />
        </div>
      </header>

      {/* --- 2. Main Greeting & Layout Grid --- */}
      <div className="grid grid-cols-12 gap-8">
        {/* --- Left Column (Span 3) --- */}
        <div className="col-span-3 space-y-8">
          {/* Date Card */}
          <Card className="p-8 flex flex-col items-start">
            <p className="text-7xl font-light">19</p>
            <p className="text-2xl font-semibold mb-4">Tue, December</p>
            <button
              style={{ backgroundColor: COLORS.accentRed }}
              className="flex items-center px-6 py-2 rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Show my Tasks <ArrowRight size={18} className="ml-2" />
            </button>
          </Card>

          {/* VISA Card */}
          <Card className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold">VISA</div>
              {/* The Direct Debits is small gray text aligned right */}
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                Direct Debits
              </p>
            </div>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Linked to main account
            </p>
            <div className="text-2xl font-semibold flex items-center space-x-4">
              <span className="text-3xl">**** 2719</span>
            </div>
            <div className="flex justify-between items-center space-x-3">
              <button
                style={{ backgroundColor: COLORS.darkBg }}
                className="flex-1 text-white py-2 rounded-xl hover:opacity-90"
              >
                Receive
              </button>
              <button
                style={{ backgroundColor: COLORS.darkBg }}
                className="flex-1 text-white py-2 rounded-xl hover:opacity-90"
              >
                Send
              </button>
            </div>

            <div
              style={{ borderColor: COLORS.textMuted }}
              className="border-t border-opacity-30 pt-4 mt-4"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  Monthly regular fee
                </p>
                <p className="text-lg font-semibold">$25.00</p>
              </div>
              <p className="text-xs mt-1" style={{ color: COLORS.accentRed }}>
                Edit card's limitation
              </p>
            </div>
          </Card>
        </div>

        {/* --- Right Main Content (Span 9) --- */}
        <div className="col-span-9 space-y-8">
          {/* Greeting Section */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-5xl font-light">Hey, Need help? 👋</h2>
              <p className="text-3xl font-light">|Just ask me anything!</p>
            </div>
            {/* The microphone button */}
            <IconButton icon={Mic} className="p-4 bg-transparent" />
          </div>

          {/* Top Row of Stat Cards (Grid) */}
          <div className="grid grid-cols-4 gap-6">
            <StatCard title="Total Income" value="$23,194.80" weekly />
            <StatCard title="Total paid" value="$8,145.20" weekly />

            {/* System Lock Card */}
            <Card className="flex flex-col items-center justify-center relative">
              <div
                className="absolute top-2 right-4 text-xs"
                style={{ color: COLORS.textMuted }}
              >
                System Lock
              </div>
              {/* Custom ring styling for the 36% progress */}
              <div
                className="w-24 h-24 rounded-full border-[10px] flex items-center justify-center"
                style={{
                  borderColor: COLORS.cardBg,
                  borderRightColor: COLORS.accentRed, // Mocking the progress fill
                  borderTopColor: COLORS.accentRed,
                }}
              >
                <span className="text-xl font-bold">36%</span>
              </div>
              <p
                className="text-sm font-medium mt-2"
                style={{ color: COLORS.textMuted }}
              >
                System Lock
              </p>
              <p className="text-xs" style={{ color: COLORS.accentRed }}>
                View on chart mode
              </p>
            </Card>

            {/* 13 Days Card */}
            <Card className="flex flex-col justify-between relative">
              <div
                className="absolute top-2 right-4 text-xs"
                style={{ color: COLORS.textMuted }}
              >
                2023
              </div>
              <p className="text-2xl font-bold text-white">13 Days</p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                100 hours, 20 minutes
              </p>
              <div className="flex space-x-1 mt-3">
                {/* Mockup for the small dots progress bar */}
                {Array(10)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full ${
                        i < 6 ? "bg-red-500" : "bg-[#1C1C1C]"
                      }`}
                    ></div>
                  ))}
              </div>
              <div className="absolute right-0 bottom-4">
                {/* Simplified yearly graph mockup */}
                <div className="w-16 h-8 bg-gray-700/50 rounded"></div>
              </div>
            </Card>
          </div>

          {/* Bottom Grid Row (Annual Profits, Main Stocks, Activity Manager) */}
          <div className="grid grid-cols-3 gap-6 h-[400px]">
            {/* Annual Profits (Span 1) */}
            <AnnualProfitsChart />

            {/* Main Stocks & Review Rating (Span 1) */}
            <div className="flex flex-col space-y-6">
              <MainStocks />
              {/* Review Rating Card */}
              <Card className="flex-1 flex flex-col justify-center">
                <p className="text-lg font-semibold mb-2">Review rating</p>
                <p className="text-2xl font-light">
                  How is your business management going?
                </p>
                <div className="flex mt-4 text-4xl space-x-1">
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span className="text-yellow-400">★</span>
                  <span
                    style={{ color: COLORS.textMuted }}
                    className="opacity-50"
                  >
                    ★
                  </span>
                  <span
                    style={{ color: COLORS.textMuted }}
                    className="opacity-50"
                  >
                    ★
                  </span>
                </div>
              </Card>
            </div>

            {/* Activity Manager (Span 1) */}
            <ActivityManager />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard1;
