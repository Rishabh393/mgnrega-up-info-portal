"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
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
  Home } from
'lucide-react';

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
    <Card className="p-6 hover:shadow-lg transition-shadow relative">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onSpeak}
          className="h-8 w-8"
          aria-label={language === 'en' ? 'Read aloud' : 'सुनें'}>

          <Volume2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          {language === 'en' ? title : titleHindi}
        </h3>
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">
          {language === 'en' ? subtitle : subtitleHindi}
        </p>
        {trend && trendValue &&
        <div className="flex items-center gap-1 mt-2">
            {trend === 'up' ?
          <TrendingUp className="h-4 w-4 text-green-600" /> :

          <TrendingDown className="h-4 w-4 text-red-600" />
          }
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trendValue}
            </span>
          </div>
        }
      </div>
    </Card>);

};

export default function MGNREGAPortal() {
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('2023-2024');
  const [loading, setLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PerformanceData | null>(null);

  // Available financial years with best data coverage
  const availableYears = [
  '2023-2024',
  '2022-2023',
  '2021-2022'];


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
      personDays: 'person-days'
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
      personDays: 'व्यक्ति-दिवस'
    }
  };

  const t = translations[language];

  // Load districts on mount
  useEffect(() => {
    fetchDistricts();
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-orange-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{t.title}</h1>
              <p className="text-sm text-orange-100">{t.subtitle}</p>
            </div>
            <Button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              variant="secondary"
              className="flex items-center gap-2">

              <Languages className="h-4 w-4" />
              {language === 'en' ? 'हिंदी' : 'English'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* District Selector */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">{t.selectDistrict}</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select
                  value={selectedDistrict}
                  onValueChange={handleDistrictChange}
                  disabled={districtsLoading}>

                  <SelectTrigger className="w-full">
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
                  <SelectTrigger className="w-full">
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
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700">

                {geoLoading ?
                <Loader2 className="h-4 w-4 animate-spin" /> :

                <MapPin className="h-4 w-4" />
                }
                {t.useLocation}
              </Button>
            </div>
          
            {selectedDistrict &&
            <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="text-sm">
                  {language === 'en' ? 'District: ' : 'जिला: '}
                  {getDistrictName(selectedDistrict)}
                </Badge>
                <Badge variant="secondary" className="text-sm">
                  {language === 'en' ? 'Financial Year: ' : 'वित्तीय वर्ष: '}
                  {selectedYear}
                </Badge>
                {data &&
              <Badge variant="outline" className="text-sm">
                    {t.lastUpdated}: {formatDate(data.updatedAt)}
                  </Badge>
              }
                <Button
                onClick={handleRefresh}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="ml-auto">

                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {t.refresh}
                </Button>
              </div>
            }
          </div>
        </Card>

        {/* Error Alert */}
        {error &&
        <Alert variant="destructive" className="mb-6">
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
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t.selectDistrictFirst}</AlertDescription>
          </Alert>
        }

        {!loading && data &&
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Active Works Card */}
              <MetricCard
              title="Active Works"
              titleHindi="सक्रिय कार्य"
              value={(data.completedWorks || 0).toLocaleString()}
              subtitle={`${(data.activeWorkers || 0).toLocaleString()} ${t.workers}`}
              subtitleHindi={`${(data.activeWorkers || 0).toLocaleString()} ${t.workers}`}
              icon={<Briefcase className="h-6 w-6 text-blue-600" />}
              color="bg-blue-100 dark:bg-blue-900"
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `Active Works: ${data.completedWorks}. ${data.activeWorkers} workers engaged.` :
                `सक्रिय कार्य: ${data.completedWorks}. ${data.activeWorkers} कार्यकर्ता लगे हुए हैं।`
              )} />


              {/* Payment Status Card */}
              <MetricCard
              title="Payment Status"
              titleHindi="भुगतान स्थिति"
              value={`₹${data.avgPayment || 0}`}
              subtitle={`${data.paymentDelayed || 0} ${t.days} avg delay`}
              subtitleHindi={`${data.paymentDelayed || 0} ${t.days} औसत देरी`}
              icon={<DollarSign className="h-6 w-6 text-green-600" />}
              color="bg-green-100 dark:bg-green-900"
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `Payment Status: Average payment is ${data.avgPayment} rupees with ${data.paymentDelayed} days average delay.` :
                `भुगतान स्थिति: औसत भुगतान ${data.avgPayment} रुपये है, ${data.paymentDelayed} दिन की औसत देरी के साथ।`
              )} />


              {/* Monthly Trend Card */}
              <MetricCard
              title="Monthly Trend"
              titleHindi="मासिक रुझान"
              value={`${(data.monthlyTrend || 0) > 0 ? '+' : ''}${data.monthlyTrend || 0}%`}
              subtitle={language === 'en' ? 'Change from last period' : 'पिछली अवधि से परिवर्तन'}
              subtitleHindi="पिछली अवधि से परिवर्तन"
              icon={<Clock className="h-6 w-6 text-purple-600" />}
              color="bg-purple-100 dark:bg-purple-900"
              trend={(data.monthlyTrend || 0) > 0 ? 'up' : 'down'}
              trendValue={`${Math.abs(data.monthlyTrend || 0)}%`}
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `Monthly Trend: ${(data.monthlyTrend || 0) > 0 ? 'Increased' : 'Decreased'} by ${Math.abs(data.monthlyTrend || 0)} percent from last period.` :
                `मासिक रुझान: पिछली अवधि से ${(data.monthlyTrend || 0) > 0 ? 'बढ़ा' : 'घटा'} ${Math.abs(data.monthlyTrend || 0)} प्रतिशत।`
              )} />


              {/* State Comparison Card */}
              <MetricCard
              title="State Comparison"
              titleHindi="राज्य तुलना"
              value={`${(data.stateAverage || 0) > 0 ? '+' : ''}${data.stateAverage || 0}%`}
              subtitle={language === 'en' ? 'vs State Average' : 'राज्य औसत बनाम'}
              subtitleHindi="राज्य औसत बनाम"
              icon={<BarChart3 className="h-6 w-6 text-orange-600" />}
              color="bg-orange-100 dark:bg-orange-900"
              trend={(data.stateAverage || 0) > 0 ? 'up' : 'down'}
              trendValue={`${Math.abs(data.stateAverage || 0)}%`}
              language={language}
              onSpeak={() => speak(
                language === 'en' ?
                `State Comparison: Your district is ${(data.stateAverage || 0) > 0 ? 'above' : 'below'} state average by ${Math.abs(data.stateAverage || 0)} percent.` :
                `राज्य तुलना: आपका जिला राज्य औसत से ${(data.stateAverage || 0) > 0 ? 'ऊपर' : 'नीचे'} ${Math.abs(data.stateAverage || 0)} प्रतिशत है।`
              )} />

            </div>

            {/* District Performance Details Section */}
            <Card className="p-6 mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
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
                className="h-8 w-8"
                aria-label={language === 'en' ? 'Read aloud' : 'सुनें'}>

                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Approved Labour Budget */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-indigo-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                      <Wallet className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold">{t.labourBudget}</p>
                      <p className="text-lg font-bold">₹{(data.approvedLabourBudget || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Average Wage Rate */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-green-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold">{t.wageRate}</p>
                      <p className="text-lg font-bold">₹{data.avgWageRate || 0}</p>
                      <p className="text-xs text-muted-foreground">{t.perDay}</p>
                    </div>
                  </div>
                </div>

                {/* Average Employment Days */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold">{t.employmentDays}</p>
                      <p className="text-lg font-bold">{data.avgDaysEmployment || 0} {t.days}</p>
                      <p className="text-xs text-muted-foreground">{t.perHousehold}</p>
                    </div>
                  </div>
                </div>

                {/* Total Households Worked */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-blue-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Home className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold">{t.householdsWorked}</p>
                      <p className="text-lg font-bold">{(data.totalHouseholdsWorked || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t.households}</p>
                    </div>
                  </div>
                </div>

                {/* Women Person-Days */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-pink-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                      <Users className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold">{t.womenParticipation}</p>
                      <p className="text-lg font-bold">{(data.womenPersondays || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{t.personDays}</p>
                    </div>
                  </div>
                </div>

                {/* Total Expenditure */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-orange-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                      <Wallet className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground font-semibold">{t.totalExpenditure}</p>
                      <p className="text-lg font-bold">₹{(data.totalExpenditure || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget Utilization Progress Bar */}
              {data.approvedLabourBudget && data.approvedLabourBudget > 0 &&
            <div className="mt-6 pt-6 border-t border-indigo-200 dark:border-gray-600">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">
                      {language === 'en' ? 'Budget Utilization' : 'बजट उपयोग'}
                    </p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {data.budgetUtilization || 0}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(data.budgetUtilization || 0, 100)}%` }} />

                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {language === 'en' ?
                `₹${(data.totalExpenditure || 0).toLocaleString()} of ₹${(data.approvedLabourBudget || 0).toLocaleString()} spent` :
                `₹${(data.approvedLabourBudget || 0).toLocaleString()} में से ₹${(data.totalExpenditure || 0).toLocaleString()} खर्च`}
                  </p>
                </div>
            }
            </Card>
          </>
        }

        {/* Footer Info */}
        <Card className="mt-8 p-6 bg-gradient-to-r from-orange-100 to-green-100 dark:from-gray-800 dark:to-gray-700">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              {language === 'en' ?
              '🌾 Empowering Rural India through Employment Guarantee' :
              '🌾 रोजगार गारंटी के माध्यम से ग्रामीण भारत को सशक्त बनाना'}
            </p>
            <p className="text-xs text-muted-foreground">
              {t.dataSource}
            </p>
          </div>
        </Card>
      </div>
    </div>);

}