"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import {
  MapPin,
  Volume2,
  Languages,
  TrendingUp,
  TrendingDown,
  Briefcase,
  DollarSign,
  Clock,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Users,
  Calendar,
  Wallet,
  Home,
  PieChart,
  Activity,
  Moon,
  Sun
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

// District interface from API
interface District {
  id: number;
  districtName: string;
  districtNameHindi: string;
  districtCode: string;
}

interface PerformanceData {
  id: number;
  districtId: number;
  finYear: string;
  month: string;
  metricWorkStatus: 'GOOD' | 'OKAY' | 'POOR' | null;
  metricPaymentStatus: 'YES' | 'NO' | null;
  metricTrend: 'UP' | 'DOWN' | 'SAME' | null;
  metricComparison: 'BETTER' | 'SAME' | 'WORSE' | null;
  activeWorkers: number | null;
  completedWorks: number | null;
  avgPayment: number | null;
  paymentDelayed: number | null;
  budgetUtilization: number | null;
  monthlyTrend: number | null;
  stateAverage: number | null;
  approvedLabourBudget: number | null;
  avgWageRate: number | null;
  avgDaysEmployment: number | null;
  totalHouseholdsWorked: number | null;
  womenPersondays: number | null;
  totalExpenditure: number | null;
  createdAt: string;
  updatedAt: string;
  districtName: string;
  districtCode: string;
  stateName: string;
}

interface MetricCardProps {
  title: string;
  titleHindi: string;
  value: string;
  subtitle: string;
  subtitleHindi: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  language: 'en' | 'hi';
  onSpeak: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  titleHindi,
  value,
  subtitle,
  subtitleHindi,
  icon,
  color,
  trend,
  trendValue,
  language,
  onSpeak
}) => {
  return (
    <Card className="p-6 hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-2 hover:border-primary/50">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl shadow-lg ${color} transform group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSpeak}
            className="h-8 w-8 hover:bg-primary/10"
            aria-label={language === 'en' ? 'Read aloud' : 'सुनें'}>
            <Volume2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {language === 'en' ? title : titleHindi}
          </h3>
          <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{value}</p>
          <p className="text-sm text-muted-foreground font-medium">
            {language === 'en' ? subtitle : subtitleHindi}
          </p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default function MGNREGAPortal() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2023-2024');
  const [loading, setLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [historicalData, setHistoricalData] = useState<PerformanceData[]>([]);
  const [historicalLoading, setHistoricalLoading] = useState(false);

  // Available financial years with best data coverage
  const availableYears = ['2023-2024', '2022-2023', '2021-2022'];

  // Set mounted state for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const translations = {
    en: {
      title: 'MGNREGA Information Portal',
      subtitle: 'Mahatma Gandhi National Rural Employment Guarantee Act',
      selectDistrict: 'Select Your District',
      selectYear: 'Select Financial Year',
      useLocation: 'Use My Location',
      activeWorks: 'Active Works',
      activeWorksSubtitle: 'Ongoing employment projects',
      paymentStatus: 'Payment Status',
      paymentStatusSubtitle: 'Average wage payment',
      monthlyTrend: 'Monthly Trend',
      monthlyTrendSubtitle: 'Change from last period',
      comparison: 'State Comparison',
      comparisonSubtitle: 'vs State Average',
      loading: 'Loading data...',
      loadingDistricts: 'Loading districts...',
      geoError: 'Unable to detect location',
      selectDistrictFirst: 'Please select a district and financial year to view data',
      noData: 'No data available for this district and financial year',
      fetchError: 'Failed to fetch data. Please try again.',
      workers: 'workers',
      days: 'days',
      refresh: 'Refresh Data',
      lastUpdated: 'Last updated',
      dataSource: 'Data source: data.gov.in via local database',
      districtPerformance: 'District Performance Details',
      labourBudget: 'Approved Labour Budget',
      wageRate: 'Avg Wage Rate',
      employmentDays: 'Avg Employment Days',
      householdsWorked: 'Households Worked',
      womenParticipation: 'Women Person-Days',
      totalExpenditure: 'Total Expenditure',
      perDay: 'per day',
      perHousehold: 'per household',
      households: 'households',
      personDays: 'person-days',
      performanceMetrics: 'Performance Metrics Overview',
      budgetAnalysis: 'Budget Analysis',
      utilizationRate: 'Utilization Rate',
      keyIndicators: 'Key Indicators Chart',
      districtComparison: 'District vs State Average',
      historicalComparison: 'Historical Performance Comparison',
      historicalSubtitle: 'District performance across financial years',
      works: 'Works',
      households2: 'Households',
      wageRate2: 'Wage Rate',
      empDays: 'Emp Days',
      expenditure: 'Expenditure (Cr)',
      budgetUtil: 'Budget %'
    },
    hi: {
      title: 'मनरेगा सूचना पोर्टल',
      subtitle: 'महात्मा गांधी राष्ट्रीय ग्रामीण रोजगार गारंटी अधिनियम',
      selectDistrict: 'अपना जिला चुनें',
      selectYear: 'वित्तीय वर्ष चुनें',
      useLocation: 'मेरा स्थान उपयोग करें',
      activeWorks: 'सक्रिय कार्य',
      activeWorksSubtitle: 'चल रहे रोजगार परियोजनाएं',
      paymentStatus: 'भुगतान स्थिति',
      paymentStatusSubtitle: 'औसत मजदूरी भुगतान',
      monthlyTrend: 'मासिक रुझान',
      monthlyTrendSubtitle: 'पिछली अवधि से परिवर्तन',
      comparison: 'राज्य तुलना',
      comparisonSubtitle: 'राज्य औसत बनाम',
      loading: 'डेटा लोड हो रहा है...',
      loadingDistricts: 'जिले लोड हो रहे हैं...',
      geoError: 'स्थान का पता नहीं लगा सके',
      selectDistrictFirst: 'डेटा देखने के लिए कृपया एक जिला और वित्तीय वर्ष चुनें',
      noData: 'इस जिले और वित्तीय वर्ष के लिए डेटा उपलब्ध नहीं है',
      fetchError: 'डेटा प्राप्त करने में विफल। कृपया पुनः प्रयास करें।',
      workers: 'कार्यकर्ता',
      days: 'दिन',
      refresh: 'डेटा रिफ्रेश करें',
      lastUpdated: 'अंतिम अपडेट',
      dataSource: 'डेटा स्रोत: data.gov.in स्थानीय डेटाबेस के माध्यम से',
      districtPerformance: 'जिला प्रदर्शन विवरण',
      labourBudget: 'स्वीकृत श्रम बजट',
      wageRate: 'औसत मजदूरी दर',
      employmentDays: 'औसत रोजगार दिवस',
      householdsWorked: 'परिवार काम किया',
      womenParticipation: 'महिला व्यक्ति-दिवस',
      totalExpenditure: 'कुल व्यय',
      perDay: 'प्रति दिन',
      perHousehold: 'प्रति परिवार',
      households: 'परिवार',
      personDays: 'व्यक्ति-दिवस',
      performanceMetrics: 'प्रदर्शन मेट्रिक्स अवलोकन',
      budgetAnalysis: 'बजट विश्लेषण',
      utilizationRate: 'उपयोग दर',
      keyIndicators: 'मुख्य संकेतक चार्ट',
      districtComparison: 'जिला बनाम राज्य औसत',
      historicalComparison: 'ऐतिहासिक प्रदर्शन तुलना',
      historicalSubtitle: 'वित्तीय वर्षों में जिला प्रदर्शन',
      works: 'कार्य',
      households2: 'परिवार',
      wageRate2: 'मजदूरी दर',
      empDays: 'रोजगार दिवस',
      expenditure: 'व्यय (करोड़)',
      budgetUtil: 'बजट %'
    }
  };

  const t = translations[language];

  // Load districts on mount
  useEffect(() => {
    fetchDistricts();
  }, []);

  // Fetch historical data when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetchHistoricalData(selectedDistrict);
    }
  }, [selectedDistrict]);

  // Fetch districts from database API
  const fetchDistricts = async () => {
    setDistrictsLoading(true);
    try {
      const response = await fetch('/api/districts?state=UTTAR%20PRADESH');
      if (!response.ok) throw new Error('Failed to fetch districts');

      const districtsData = await response.json();
      setDistricts(districtsData);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setError(t.fetchError);
    } finally {
      setDistrictsLoading(false);
    }
  };

  // Fetch performance data from database API using financial year format
  const fetchPerformanceData = async (districtCode: string, financialYear: string) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Use financial year format directly: /api/performance/[district_code]/[financial_year]
      const response = await fetch(`/api/performance/${encodeURIComponent(districtCode)}/${encodeURIComponent(financialYear)}`);

      if (response.status === 404) {
        setError(t.noData);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch performance data');
      }

      const performanceData = await response.json();
      setData(performanceData);
    } catch (err) {
      console.error('Error fetching performance data:', err);
      setError(t.fetchError);
    } finally {
      setLoading(false);
    }
  };

  // Fetch historical data for all years
  const fetchHistoricalData = async (districtCode: string) => {
    setHistoricalLoading(true);
    try {
      const promises = availableYears.map(year =>
        fetch(`/api/performance/${encodeURIComponent(districtCode)}/${encodeURIComponent(year)}`)
          .then(res => res.ok ? res.json() : null)
          .catch(() => null)
      );
      
      const results = await Promise.all(promises);
      const validData = results.filter((d): d is PerformanceData => d !== null);
      setHistoricalData(validData);
    } catch (err) {
      console.error('Error fetching historical data:', err);
    } finally {
      setHistoricalLoading(false);
    }
  };

  // Geolocation using Nominatim
  const handleGeolocation = async () => {
    setGeoLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError(t.geoError);
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
          );
          const locationData = await response.json();

          const detectedDistrict = locationData.address?.state_district ||
          locationData.address?.county ||
          locationData.address?.city;

          if (detectedDistrict) {
            // Find matching district from our database
            const matchedDistrict = districts.find((d) =>
            d.districtName.toLowerCase().includes(detectedDistrict.toLowerCase()) ||
            detectedDistrict.toLowerCase().includes(d.districtName.toLowerCase())
            );

            if (matchedDistrict) {
              setSelectedDistrict(matchedDistrict.districtCode);
              fetchPerformanceData(matchedDistrict.districtCode, selectedYear);
            } else {
              setError('District not found in Uttar Pradesh. Please select manually.');
            }
          }
        } catch (err) {
          setError(t.geoError);
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setError(t.geoError);
        setGeoLoading(false);
      }
    );
  };

  // Text-to-speech functionality
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    fetchPerformanceData(value, selectedYear);
  };

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    if (selectedDistrict) {
      fetchPerformanceData(selectedDistrict, value);
    }
  };

  const handleRefresh = () => {
    if (selectedDistrict) {
      fetchPerformanceData(selectedDistrict, selectedYear);
    }
  };

  const getDistrictName = (code: string) => {
    const district = districts.find((d) => d.districtCode === code);
    return district ? language === 'en' ? district.districtName : district.districtNameHindi : '';
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-950 dark:via-blue-950 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-8 px-4 shadow-2xl border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold mb-1 drop-shadow-lg">{t.title}</h1>
              <p className="text-sm text-blue-100 font-medium">{t.subtitle}</p>
            </div>
            <div className="flex gap-2">
              {mounted && (
                <Button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  variant="secondary"
                  size="icon"
                  className="bg-white/90 hover:bg-white text-blue-700 shadow-lg">
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}
              <Button
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                variant="secondary"
                className="flex items-center gap-2 bg-white/90 hover:bg-white text-blue-700 font-semibold shadow-lg">
                <Languages className="h-4 w-4" />
                {language === 'en' ? 'हिंदी' : 'English'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* District Selector */}
        <Card className="p-6 mb-8 shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-950/30">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary">
            <MapPin className="h-5 w-5" />
            {t.selectDistrict}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={selectedDistrict}
                  onValueChange={handleDistrictChange}
                  disabled={districtsLoading}>

                  <SelectTrigger className="w-full border-2 hover:border-primary transition-colors">
                    <SelectValue placeholder={districtsLoading ? t.loadingDistricts : t.selectDistrict} />
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map((district) =>
                    <SelectItem key={district.districtCode} value={district.districtCode}>
                        {language === 'en' ? district.districtName : district.districtNameHindi}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-full border-2 hover:border-primary transition-colors">
                    <SelectValue placeholder={t.selectYear} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map((year) =>
                    <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGeolocation}
                disabled={geoLoading || districtsLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg">

                {geoLoading ?
                <Loader2 className="h-4 w-4 animate-spin" /> :

                <MapPin className="h-4 w-4" />
                }
                {t.useLocation}
              </Button>
            </div>
          
            {selectedDistrict &&
            <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                  {language === 'en' ? 'District: ' : 'जिला: '}
                  {getDistrictName(selectedDistrict)}
                </Badge>
                <Badge variant="secondary" className="text-sm font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-100">
                  {language === 'en' ? 'Financial Year: ' : 'वित्तीय वर्ष: '}
                  {selectedYear}
                </Badge>
                {data &&
              <Badge variant="outline" className="text-sm font-medium">
                    {t.lastUpdated}: {formatDate(data.updatedAt)}
                  </Badge>
              }
                <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="ml-auto hover:bg-primary/10">

                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t.refresh}
                </Button>
              </div>
            }
          </div>
        </Card>

        {/* Error Alert */}
        {error &&
        <Alert variant="destructive" className="mb-6 border-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        }

        {/* Loading State */}
        {loading &&
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) =>
          <Card key={i} className="p-6">
                <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </Card>
          )}
          </div>
        }

        {/* Data Display */}
        {!loading && !data && !selectedDistrict &&
        <Alert className="border-2 border-primary/30 bg-primary/5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t.selectDistrictFirst}</AlertDescription>
          </Alert>
        }

        {!loading && data &&
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <MetricCard
              title="Active Works"
              titleHindi="सक्रिय कार्य"
              value={(data.completedWorks || 0).toLocaleString()}
              subtitle={`${(data.activeWorkers || 0).toLocaleString()} ${t.workers}`}
              subtitleHindi={`${(data.activeWorkers || 0).toLocaleString()} ${t.workers}`}
              icon={<Briefcase className="h-6 w-6 text-blue-700" />}
              color="bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800"
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `Active Works: ${data.completedWorks}. ${data.activeWorkers} workers engaged.` :
                `सक्रिय कार्य: ${data.completedWorks}. ${data.activeWorkers} कार्यकर्ता लगे हुए हैं।`
              )} />

              <MetricCard
              title="Payment Status"
              titleHindi="भुगतान स्थिति"
              value={`₹${data.avgPayment || 0}`}
              subtitle={`${data.paymentDelayed || 0} ${t.days} avg delay`}
              subtitleHindi={`${data.paymentDelayed || 0} ${t.days} औसत देरी`}
              icon={<DollarSign className="h-6 w-6 text-green-700" />}
              color="bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800"
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `Payment Status: Average payment is ${data.avgPayment} rupees with ${data.paymentDelayed} days average delay.` :
                `भुगतान स्थिति: औसत भुगतान ${data.avgPayment} रुपये है, ${data.paymentDelayed} दिन की औसत देरी के साथ।`
              )} />

              <MetricCard
              title="Monthly Trend"
              titleHindi="मासिक रुझान"
              value={`${(data.monthlyTrend || 0) > 0 ? '+' : ''}${data.monthlyTrend || 0}%`}
              subtitle={language === 'en' ? 'Change from last period' : 'पिछली अवधि से परिवर्तन'}
              subtitleHindi="पिछली अवधि से परिवर्तन"
              icon={<Clock className="h-6 w-6 text-purple-700" />}
              color="bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800"
              trend={(data.monthlyTrend || 0) > 0 ? 'up' : 'down'}
              trendValue={`${Math.abs(data.monthlyTrend || 0)}%`}
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `Monthly Trend: ${(data.monthlyTrend || 0) > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(data.monthlyTrend || 0)} percent from last period.` :
                `मासिक रुझान: पिछली अवधि से ${(data.monthlyTrend || 0) > 0 ? 'बढ़ा' : 'घटा'} ${Math.abs(data.monthlyTrend || 0)} प्रतिशत।`
              )} />

              <MetricCard
              title="State Comparison"
              titleHindi="राज्य तुलना"
              value={`${(data.stateAverage || 0) > 0 ? '+' : ''}${data.stateAverage || 0}%`}
              subtitle={language === 'en' ? 'vs State Average' : 'राज्य औसत बनाम'}
              subtitleHindi="राज्य औसत बनाम"
              icon={<BarChart3 className="h-6 w-6 text-orange-700" />}
              color="bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800"
              trend={(data.stateAverage || 0) > 0 ? 'up' : 'down'}
              trendValue={`${Math.abs(data.stateAverage || 0)}%`}
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `State Comparison: Your district is ${(data.stateAverage || 0) > 0 ? 'above' : 'below'} state average by ${Math.abs(data.stateAverage || 0)} percent.` :
                `राज्य तुलना: आपका जिला राज्य औसत से ${(data.stateAverage || 0) > 0 ? 'ऊपर' : 'नीचे'} ${Math.abs(data.stateAverage || 0)} प्रतिशत है।`
              )} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900 dark:to-blue-950/30">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                  <BarChart3 className="h-5 w-5" />
                  {t.keyIndicators}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: language === 'en' ? 'Works' : 'कार्य',
                        value: data.completedWorks || 0
                      },
                      {
                        name: language === 'en' ? 'Workers' : 'कार्यकर्ता',
                        value: data.activeWorkers || 0
                      },
                      {
                        name: language === 'en' ? 'Households' : 'परिवार',
                        value: Math.round((data.totalHouseholdsWorked || 0) / 10)
                      },
                      {
                        name: language === 'en' ? 'Emp Days' : 'रोजगार दिवस',
                        value: data.avgDaysEmployment || 0
                      }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                    <XAxis dataKey="name" stroke="#6366f1" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6366f1" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '2px solid #6366f1',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {[0, 1, 2, 3].map((index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={['#3b82f6', '#22c55e', '#a855f7', '#f59e0b'][index]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6 shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white to-indigo-50/50 dark:from-gray-900 dark:to-indigo-950/30">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
                  <PieChart className="h-5 w-5" />
                  {t.budgetAnalysis}
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="100%"
                    barSize={30}
                    data={[
                      {
                        name: t.utilizationRate,
                        value: data.budgetUtilization || 0,
                        fill: '#6366f1'
                      }
                    ]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                    />
                    <text
                      x="50%"
                      y="50%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-4xl font-bold fill-primary"
                    >
                      {data.budgetUtilization || 0}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {language === 'en'
                      ? `₹${(data.totalExpenditure || 0).toLocaleString()} of ₹${(data.approvedLabourBudget || 0).toLocaleString()}`
                      : `₹${(data.approvedLabourBudget || 0).toLocaleString()} में से ₹${(data.totalExpenditure || 0).toLocaleString()}`}
                  </p>
                </div>
              </Card>
            </div>

            <Card className="p-6 mb-8 shadow-xl border-2 border-primary/20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                  <Activity className="h-5 w-5" />
                  {t.districtPerformance}
                </h2>
                <Button
                variant="ghost"
                size="icon"
                onClick={() => speak(
                  language === 'en' ?
                  `District Performance Details: Approved Labour Budget is ${(data.approvedLabourBudget || 0).toLocaleString()} rupees. Average wage rate is ${data.avgWageRate || 0} rupees per day per person. Average employment days provided per household is ${data.avgDaysEmployment || 0} days. Total ${(data.totalHouseholdsWorked || 0).toLocaleString()} households worked. Women participated for ${(data.womenPersondays || 0).toLocaleString()} person-days. Total expenditure is ${(data.totalExpenditure || 0).toLocaleString()} rupees.` :
                  `जिला प्रदर्शन विवरण: स्वीकृत श्रम बजट ${(data.approvedLabourBudget || 0).toLocaleString()} रुपये है। औसत मजदूरी दर ${data.avgWageRate || 0} रुपये प्रति दिन प्रति व्यक्ति है। प्रति परिवार दिए गए औसत रोजगार दिवस ${data.avgDaysEmployment || 0} दिन हैं। कुल ${(data.totalHouseholdsWorked || 0).toLocaleString()} परिवारों ने काम किया। महिलाओं ने ${(data.womenPersondays || 0).toLocaleString()} व्यक्ति-दिवस के लिए भाग लिया। कुल व्यय ${(data.totalExpenditure || 0).toLocaleString()} रुपये है।`
                )}
                className="h-8 w-8 hover:bg-primary/10"
                aria-label={language === 'en' ? 'Read aloud' : 'सुनें'}>

                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-indigo-100 dark:border-indigo-900 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 rounded-lg shadow-md">
                      <Wallet className="h-5 w-5 text-indigo-700 dark:text-indigo-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t.labourBudget}</p>
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">₹{(data.approvedLabourBudget || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-green-100 dark:border-green-900 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-lg shadow-md">
                      <DollarSign className="h-5 w-5 text-green-700 dark:text-green-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t.wageRate}</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-300">₹{data.avgWageRate || 0}</p>
                      <p className="text-xs text-muted-foreground">{t.perDay}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-purple-100 dark:border-purple-900 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-lg shadow-md">
                      <Calendar className="h-5 w-5 text-purple-700 dark:text-purple-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t.employmentDays}</p>
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{data.avgDaysEmployment || 0} {t.days}</p>
                      <p className="text-xs text-muted-foreground">{t.perHousehold}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-blue-100 dark:border-blue-900 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-lg shadow-md">
                      <Home className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t.householdsWorked}</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{(data.totalHouseholdsWorked || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t.households}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-pink-100 dark:border-pink-900 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 rounded-lg shadow-md">
                      <Users className="h-5 w-5 text-pink-700 dark:text-pink-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t.womenParticipation}</p>
                      <p className="text-lg font-bold text-pink-700 dark:text-pink-300">{(data.womenPersondays || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t.personDays}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-orange-100 dark:border-orange-900 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-lg shadow-md">
                      <Wallet className="h-5 w-5 text-orange-700 dark:text-orange-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t.totalExpenditure}</p>
                      <p className="text-lg font-bold text-orange-700 dark:text-orange-300">₹{(data.totalExpenditure || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {data.approvedLabourBudget && data.approvedLabourBudget > 0 &&
            <div className="mt-6 pt-6 border-t-2 border-indigo-200 dark:border-indigo-800">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-primary">
                      {language === 'en' ? 'Budget Utilization' : 'बजट उपयोग'}
                    </p>
                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                      {data.budgetUtilization || 0}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 shadow-inner">
                    <div
                      className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 h-4 rounded-full transition-all duration-500 shadow-lg"
                      style={{ width: `${Math.min(data.budgetUtilization || 0, 100)}%` }} />

                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">
                    {language === 'en' ?
                `₹${(data.totalExpenditure || 0).toLocaleString()} of ₹${(data.approvedLabourBudget || 0).toLocaleString()} spent` :
                `₹${(data.approvedLabourBudget || 0).toLocaleString()} में से ₹${(data.totalExpenditure || 0).toLocaleString()} खर्च`}
                  </p>
                </div>
            }
            </Card>

            {/* NEW: Historical Performance Comparison Chart */}
            {historicalData.length > 0 && (
              <Card className="p-6 mb-8 shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900 dark:to-purple-950/30">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
                      <TrendingUp className="h-5 w-5" />
                      {t.historicalComparison}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">{t.historicalSubtitle}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => speak(
                      language === 'en' ?
                        `Historical Performance Comparison across ${historicalData.length} years showing works completed, households benefited, wage rates, employment days, expenditure and budget utilization trends for ${getDistrictName(selectedDistrict)} district.` :
                        `${getDistrictName(selectedDistrict)} जिले के लिए ${historicalData.length} वर्षों में ऐतिहासिक प्रदर्शन तुलना जिसमें पूर्ण कार्य, लाभार्थी परिवार, मजदूरी दर, रोजगार दिवस, व्यय और बजट उपयोग रुझान दिखाए गए हैं।`
                    )}
                    className="h-8 w-8 hover:bg-primary/10"
                    aria-label={language === 'en' ? 'Read aloud' : 'सुनें'}>
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <ResponsiveContainer width="100%" height={450}>
                  <BarChart
                    data={historicalData.map(item => ({
                      year: item.finYear,
                      [t.works]: item.completedWorks || 0,
                      [t.households2]: Math.round((item.totalHouseholdsWorked || 0) / 100),
                      [t.wageRate2]: item.avgWageRate || 0,
                      [t.empDays]: item.avgDaysEmployment || 0,
                      [t.expenditure]: Math.round((item.totalExpenditure || 0) / 10000000),
                      [t.budgetUtil]: item.budgetUtilization || 0
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" className="dark:opacity-20" />
                    <XAxis 
                      dataKey="year" 
                      stroke="#6366f1" 
                      style={{ fontSize: '12px', fontWeight: 600 }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      stroke="#6366f1" 
                      style={{ fontSize: '11px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        border: '2px solid #6366f1',
                        borderRadius: '12px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#4f46e5' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                    <Bar dataKey={t.works} fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t.households2} fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t.wageRate2} fill="#22c55e" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t.empDays} fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t.expenditure} fill="#ec4899" radius={[6, 6, 0, 0]} />
                    <Bar dataKey={t.budgetUtil} fill="#06b6d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium">{t.works}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs font-medium">{t.households2} (÷100)</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium">{t.wageRate2}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs font-medium">{t.empDays}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-950/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                    <span className="text-xs font-medium">{t.expenditure}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <span className="text-xs font-medium">{t.budgetUtil}</span>
                  </div>
                </div>
              </Card>
            )}
          </>
        }

        {/* Footer Info */}
        <Card className="mt-8 p-6 shadow-xl border-2 border-primary/20 bg-gradient-to-r from-orange-100 via-green-100 to-blue-100 dark:from-orange-950 dark:via-green-950 dark:to-blue-950">
          <div className="text-center space-y-2">
            <p className="text-sm font-bold text-primary">
              {language === 'en' ?
              '🌾 Empowering Rural India through Employment Guarantee' :
              '🌾 रोजगार गारंटी के माध्यम से ग्रामीण भारत को सशक्त बनाना'}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {t.dataSource}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}