import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/ui/navigation';
import { MinimalFooter } from '@/components/ui/minimal-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Upload, User, Store, Save, Mail, Phone, Calendar, Shield, QrCode, Link as LinkIcon, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [existingScreenshot, setExistingScreenshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role === 'shopkeeper') {
      fetchShopProfile();
    }
  }, [user]);

  const fetchShopProfile = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
      const shops = await fetch(`${API_URL}/shops/owner/${user?.id}`)
        .then(res => res.json());
      
      if (shops.success && shops.data.length > 0) {
        const shop = shops.data[0];
        setUpiId(shop.upi_id || '');
        if (shop.payment_screenshot) {
          setExistingScreenshot(shop.payment_screenshot);
        }
      }
    } catch (error) {
      console.error('Error fetching shop profile:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            variant: 'destructive',
            title: 'File too large',
            description: 'Please select an image smaller than 5MB',
          });
          return;
        }
        setScreenshot(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setScreenshotPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select an image file',
        });
      }
    }
  };

  const handleSave = async () => {
    if (user?.role === 'shopkeeper') {
      setLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
        const shops = await fetch(`${API_URL}/shops/owner/${user.id}`)
          .then(res => res.json());
        
        if (!shops.success || shops.data.length === 0) {
          throw new Error('No shop found');
        }

        const shop = shops.data[0];
        let screenshotBase64 = existingScreenshot;

        if (screenshot) {
          const reader = new FileReader();
          screenshotBase64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(screenshot);
          });
        }

        const response = await fetch(`${API_URL}/shops/${shop.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            upiId: upiId || null,
            payment_screenshot: screenshotBase64 || null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Server error response:', errorData);
          throw new Error(errorData.error || 'Failed to update profile');
        }

        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });

        setScreenshot(null);
        setScreenshotPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        if (screenshotBase64) {
          setExistingScreenshot(screenshotBase64);
        }
      } catch (error: any) {
        console.error('Error saving profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to update profile',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => {
            // Navigate based on user role
            if (user?.role === 'shopkeeper') {
              navigate('/admin');
            } else if (user?.role === 'student') {
              navigate('/home');
            } else {
              navigate(-1); // Go back to previous page
            }
          }}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <Avatar className="h-24 w-24 bg-gradient-to-r from-orange-500 to-amber-500">
                    <AvatarFallback className="text-3xl text-white font-bold">
                      {user?.name ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                    <Badge className="mt-2 bg-orange-100 text-orange-800 border-orange-200">
                      {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                    </Badge>
                  </div>
                  <Separator />
                    <div className="w-full space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Member since</span>
                        <span className="font-medium">
                          {(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-orange-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your account details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input value={user?.name || ''} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input value={user?.email || ''} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Account Role
                    </Label>
                    <Input value={user?.role || ''} disabled className="bg-gray-50 capitalize" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </Label>
                    <Input 
                      value={(user as any)?.createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Recently'} 
                      disabled 
                      className="bg-gray-50" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shopkeeper Specific Fields */}
            {user?.role === 'shopkeeper' && (
              <>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5 text-orange-600" />
                      Payment Settings
                    </CardTitle>
                    <CardDescription>Configure your payment receiving options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="upiId" className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4" />
                        UPI ID
                      </Label>
                      <Input
                        id="upiId"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@upi"
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <QrCode className="h-3 w-3" />
                        Enter your UPI ID for receiving payments from customers
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        Payment QR Code Screenshot
                      </Label>
                      {existingScreenshot && !screenshotPreview && (
                        <div className="relative border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
                          <img
                            src={existingScreenshot}
                            alt="Current QR code"
                            className="w-full h-64 object-contain rounded-lg"
                          />
                        </div>
                      )}
                      {screenshotPreview ? (
                        <div className="relative border-2 border-orange-200 rounded-lg p-2 bg-orange-50">
                          <img
                            src={screenshotPreview}
                            alt="Payment screenshot preview"
                            className="w-full h-64 object-contain rounded-lg"
                          />
                        </div>
                      ) : !existingScreenshot ? (
                        <div
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-all"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Click to upload QR code screenshot
                          </p>
                          <p className="text-xs text-gray-400">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                      ) : null}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      {existingScreenshot && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Change Screenshot
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </Button>
              </>
            )}

            {/* Student Profile Info */}
            {user?.role === 'student' && (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-orange-600" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      Your profile information is displayed above. To update your personal details, please contact support.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <MinimalFooter />
    </div>
  );
}
