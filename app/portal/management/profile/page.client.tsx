"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  Camera,
  Edit3,
  Settings,
  Globe,
  Bell,
  Lock,
  Save,
  X,
  Loader2,
} from "lucide-react";
import {
  api,
  UserProfile,
  NotificationSettings,
  ChangePasswordData,
} from "@/lib/api";

// Language content object
const translations = {
  en: {
    title: "User Profile",
    subtitle: "Manage your account settings and preferences",
    personalInfo: "Personal Information",
    contactInfo: "Contact Information",
    workInfo: "Work Information",
    settings: "Settings",
    security: "Security",
    notifications: "Notifications",
    language: "Language",
    name: "Full Name",
    email: "Email Address",
    phone: "Phone Number",
    mobile: "Mobile Number",
    position: "Position",
    department: "Department",
    company: "Company",
    location: "Location",
    updateProfile: "Update Profile",
    changePassword: "Change Password",
    uploadPhoto: "Upload Photo",
    editProfile: "Edit Profile",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    english: "English",
    portuguese: "Portuguese",
    emailNotifications: "Email Notifications",
    pushNotifications: "Push Notifications",
    smsNotifications: "SMS Notifications",
    accountStatus: "Account Status",
    lastLogin: "Last Login",
    memberSince: "Member Since",
    active: "Active",
    timezone: "Timezone",
    dateFormat: "Date Format",
  },
  pt: {
    title: "Perfil do Usuário",
    subtitle: "Gerencie suas configurações de conta e preferências",
    personalInfo: "Informações Pessoais",
    contactInfo: "Informações de Contato",
    workInfo: "Informações de Trabalho",
    settings: "Configurações",
    security: "Segurança",
    notifications: "Notificações",
    language: "Idioma",
    name: "Nome Completo",
    email: "Endereço de Email",
    phone: "Número de Telefone",
    mobile: "Número de Celular",
    position: "Posição",
    department: "Departamento",
    company: "Empresa",
    location: "Localização",
    updateProfile: "Atualizar Perfil",
    changePassword: "Alterar Senha",
    uploadPhoto: "Carregar Foto",
    editProfile: "Editar Perfil",
    saveChanges: "Salvar Alterações",
    cancel: "Cancelar",
    english: "Inglês",
    portuguese: "Português",
    emailNotifications: "Notificações por Email",
    pushNotifications: "Notificações Push",
    smsNotifications: "Notificações SMS",
    accountStatus: "Status da Conta",
    lastLogin: "Último Login",
    memberSince: "Membro Desde",
    active: "Ativo",
    timezone: "Fuso Horário",
    dateFormat: "Formato de Data",
  },
};

export default function ProfilePage() {
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "pt">("en");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    userProfileID: "user123",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileData, setProfileData] = useState<UserProfile>({
    userProfileID: "user123",
    name: "",
    email: "",
    phone: "",
    mobile: "",
    position: "",
    department: "",
    company: "",
    location: "",
    avatarURL: "/api/placeholder/150/150",
    lastLogin: "",
    memberSince: "",
    timezone: "Asia/Karachi",
    dateFormat: "DD/MM/YYYY",
    language: "en",
    accountStatus: "Active",
    notificationSettings: {
      userProfileID: "user123", // Add userProfileID to notification settings
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
    },
  });

  const t = translations[currentLanguage];

  const fetchUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userProfile = await api.getUserProfile("user123");
      setProfileData(userProfile);
      setCurrentLanguage(userProfile.language as "en" | "pt");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (newLanguage: "en" | "pt") => {
    try {
      console.log("Updating language to:", newLanguage);

      // Update both UI state and backend
      setCurrentLanguage(newLanguage);
      setProfileData((prev) => ({ ...prev, language: newLanguage }));

      // Update backend
      const updateData = { language: newLanguage };
      console.log("Sending update data:", updateData);

      await api.updateUserProfile("user123", updateData);
      localStorage.setItem("preferred-language", newLanguage);

      setSuccess("Language updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Language update error:", err);
      setError("Failed to update language");
      // Revert on error
      setCurrentLanguage(profileData.language as "en" | "pt");
    }
  };

  const handleProfileUpdate = (field: keyof UserProfile, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = async (type: keyof NotificationSettings) => {
    // Store current settings for potential rollback
    const previousSettings = { ...profileData.notificationSettings };

    const newSettings = {
      ...profileData.notificationSettings,
      [type]: !profileData.notificationSettings[type],
    };

    // Optimistic update
    setProfileData((prev) => ({
      ...prev,
      notificationSettings: newSettings,
    }));

    try {
      console.log("Updating notification:", type, "to:", newSettings[type]);

      const response = await api.updateNotificationSettings(
        "user123",
        newSettings
      );
      console.log("Notification API Response:", response);

      if (
        response.message.includes("success") ||
        response.message.includes("updated")
      ) {
        setSuccess("Notification settings updated successfully");
      } else {
        setError(
          response.message || "Update completed but no changes detected"
        );
      }

      setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
    } catch (err) {
      console.error("Notification update error:", err);

      // Revert on error with proper error message
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update notification settings"
      );

      setProfileData((prev) => ({
        ...prev,
        notificationSettings: previousSettings, // Use the stored previous settings
      }));

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updateData = {
        ...profileData,
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        mobile: profileData.mobile,
        position: profileData.position,
        department: profileData.department,
        company: profileData.company,
        location: profileData.location,
        timezone: profileData.timezone,
        dateFormat: profileData.dateFormat,
        language: profileData.language,
        avatarURL: profileData.avatarURL,
      };

      await api.updateUserProfile("user123", updateData);
      setIsEditing(false);
      setSuccess("Profile updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!passwordData.currentPassword) {
      setError("Current password is required");
      return;
    }

    if (!passwordData.newPassword) {
      setError("New password is required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError("New password must be at least 6 characters long");
      return;
    }

    // Optional: Check if new password is different from current
    if (passwordData.currentPassword === passwordData.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    try {
      console.log("Attempting password change...");

      const response = await api.changePassword("user123", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      console.log("Password change response:", response);

      // Handle different success responses
      if (
        response.message &&
        (response.message.toLowerCase().includes("success") ||
          response.message.toLowerCase().includes("changed") ||
          response.message.toLowerCase().includes("updated"))
      ) {
        setSuccess("Password changed successfully!");

        // Reset form and close dialog with slight delay for user to see success message
        setTimeout(() => {
          setPasswordDialogOpen(false);
          setPasswordData({
            userProfileID: "user123",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        }, 1500);
      } else {
        setError(
          response.message || "Password change completed without confirmation"
        );
      }
    } catch (err) {
      console.error("Password change failed:", err);

      let errorMessage = "Failed to change password";

      if (err instanceof Error) {
        // Handle specific error messages from backend
        const errMsg = err.message.toLowerCase();

        if (
          errMsg.includes("current password") ||
          errMsg.includes("incorrect password")
        ) {
          errorMessage = "Current password is incorrect";
        } else if (errMsg.includes("weak") || errMsg.includes("strength")) {
          errorMessage = "New password is too weak";
        } else if (errMsg.includes("same") || errMsg.includes("identical")) {
          errorMessage = "New password cannot be the same as current password";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className='bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center space-x-2'>
            <Loader2 className='w-6 h-6 animate-spin' />
            <span className='text-gray-600'>Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen p-6'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>{t.title}</h1>
            <p className='text-gray-600 mt-1'>{t.subtitle}</p>
          </div>
          <div className='flex gap-3'>
            <Dialog
              open={passwordDialogOpen}
              onOpenChange={setPasswordDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant='outline' size='sm'>
                  <Lock className='w-4 h-4 mr-2' />
                  {t.changePassword}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.changePassword}</DialogTitle>
                  <DialogDescription>
                    Update your password to keep your account secure.
                  </DialogDescription>
                </DialogHeader>

                {/* Success Message */}
                {success && (
                  <div className='p-3 bg-green-100 border border-green-300 rounded-md'>
                    <div className='text-green-700 text-sm'>{success}</div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className='p-3 bg-red-100 border border-red-300 rounded-md'>
                    <div className='text-red-700 text-sm'>{error}</div>
                  </div>
                )}

                <div className='space-y-4'>
                  <div className='space-y-2'>
                    <Label>Current Password</Label>
                    <Input
                      type='password'
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder='Enter current password'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>New Password</Label>
                    <Input
                      type='password'
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder='Enter new password (min. 6 characters)'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>Confirm New Password</Label>
                    <Input
                      type='password'
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder='Confirm new password'
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    className='w-full'
                    disabled={
                      !passwordData.currentPassword ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                  >
                    Change Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "secondary" : "default"}
              size='sm'
              disabled={isSaving}
            >
              {isEditing ? (
                <>
                  <X className='w-4 h-4 mr-2' />
                  {t.cancel}
                </>
              ) : (
                <>
                  <Edit3 className='w-4 h-4 mr-2' />
                  {t.editProfile}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className='mb-4 p-3 bg-green-100 border border-green-300 rounded-md'>
          <div className='text-green-700 text-sm'>{success}</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className='mb-4 p-3 bg-red-100 border border-red-300 rounded-md'>
          <div className='text-red-700 text-sm'>{error}</div>
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Column - Profile Overview */}
        <div className='lg:col-span-1 space-y-6'>
          {/* Profile Card */}
          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardContent className='p-6'>
              <div className='flex flex-col items-center text-center'>
                <div className='relative'>
                  <Avatar className='w-32 h-32 border-4 border-white shadow-lg'>
                    <AvatarImage src={profileData.avatarURL} />
                    <AvatarFallback className='text-2xl bg-blue-500 text-white'>
                      {profileData.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size='sm'
                    className='absolute -bottom-2 -right-2 rounded-full w-10 h-10 p-0 shadow-lg'
                  >
                    <Camera className='w-4 h-4' />
                  </Button>
                </div>
                <h2 className='text-2xl font-bold mt-4 text-gray-900'>
                  {profileData.name}
                </h2>
                <p className='text-blue-600 font-medium'>
                  {profileData.position}
                </p>
                <p className='text-gray-500 text-sm'>
                  {profileData.department}
                </p>
                <Badge
                  variant='secondary'
                  className='mt-2 bg-green-100 text-green-700'
                >
                  <div className='w-2 h-2 bg-green-500 rounded-full mr-2'></div>
                  {t.active}
                </Badge>
              </div>

              <Separator className='my-6' />

              <div className='space-y-4'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-500'>{t.lastLogin}:</span>
                  <span className='font-medium'>{profileData.lastLogin}</span>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-500'>{t.memberSince}:</span>
                  <span className='font-medium'>{profileData.memberSince}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings 
          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardHeader>
              <CardTitle className='flex items-center text-lg'>
                <Settings className='w-5 h-5 mr-2' />
                {t.settings}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              
              <div className='space-y-2'>
                <Label className='text-sm font-medium flex items-center'>
                  <Globe className='w-4 h-4 mr-2' />
                  {t.language}
                </Label>
                <Select
                  value={profileData.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='en'>
                      <span className='flex items-center'>🇺🇸 {t.english}</span>
                    </SelectItem>
                    <SelectItem value='pt'>
                      <span className='flex items-center'>
                        🇵🇹 {t.portuguese}
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>{t.timezone}</Label>
                <Select
                  value={profileData.timezone}
                  onValueChange={(value) =>
                    handleProfileUpdate("timezone", value)
                  }
                  //disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Asia/Karachi'>
                      Asia/Karachi (PKT)
                    </SelectItem>
                    <SelectItem value='Europe/Lisbon'>
                      Europe/Lisbon (WET)
                    </SelectItem>
                    <SelectItem value='UTC'>UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
            </CardContent>
          </Card>*/}
          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardHeader>
              <CardTitle className='flex items-center text-lg'>
                <Settings className='w-5 h-5 mr-2' />
                {t.settings}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Language Selector as Switch */}
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label className='text-base flex items-center'>
                    <Globe className='w-4 h-4 mr-2' />
                    {t.language}
                  </Label>
                  <div className='text-sm text-gray-500'>
                    {profileData.language === "en" ? "English" : "Portuguese"}
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-500'>PT</span>
                  <Switch
                    checked={profileData.language === "en"}
                    onCheckedChange={(checked) => {
                      const newLanguage = checked ? "en" : "pt";
                      handleLanguageChange(newLanguage);
                    }}
                  />
                  <span className='text-sm text-gray-500'>EN</span>
                </div>
              </div>

              {/* Timezone Selector as Switch 
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>{t.timezone}</Label>
                  <div className='text-sm text-gray-500'>
                    {profileData.timezone === "Asia/Karachi"
                      ? "Asia/Karachi (PKT)"
                      : "Europe/Lisbon (WET)"}
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-500'>WET</span>
                  <Switch
                    checked={profileData.timezone === "Asia/Karachi"}
                    onCheckedChange={(checked) => {
                      const newTimezone = checked
                        ? "Asia/Karachi"
                        : "Europe/Lisbon";
                      handleProfileUpdate("timezone", newTimezone);
                    }}
                  />
                  <span className='text-sm text-gray-500'>PKT</span>
                </div>
              </div>
              */}
              {/* Date Format Selector as Switch 
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>{t.dateFormat}</Label>
                  <div className='text-sm text-gray-500'>
                    {profileData.dateFormat}
                  </div>
                </div>
                <div className='flex items-center space-x-2'>
                  <span className='text-sm text-gray-500'>MM/DD/YYYY</span>
                  <Switch
                    checked={profileData.dateFormat === "DD/MM/YYYY"}
                    onCheckedChange={(checked) => {
                      const newDateFormat = checked
                        ? "DD/MM/YYYY"
                        : "MM/DD/YYYY";
                      handleProfileUpdate("dateFormat", newDateFormat);
                    }}
                  />
                  <span className='text-sm text-gray-500'>DD/MM/YYYY</span>
                </div>
              </div>
              */}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Detailed Information */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Personal Information */}
          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <User className='w-5 h-5 mr-2' />
                {t.personalInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t.name}</Label>
                  <Input
                    id='name'
                    value={profileData.name}
                    onChange={(e) =>
                      handleProfileUpdate("name", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='position'>{t.position}</Label>
                  <Input
                    id='position'
                    value={profileData.position}
                    onChange={(e) =>
                      handleProfileUpdate("position", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='department'>{t.department}</Label>
                  <Input
                    id='department'
                    value={profileData.department}
                    onChange={(e) =>
                      handleProfileUpdate("department", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='company'>{t.company}</Label>
                  <Input
                    id='company'
                    value={profileData.company}
                    onChange={(e) =>
                      handleProfileUpdate("company", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Mail className='w-5 h-5 mr-2' />
                {t.contactInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-2'>
                  <Label htmlFor='email' className='flex items-center'>
                    <Mail className='w-4 h-4 mr-1' />
                    {t.email}
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    value={profileData.email}
                    onChange={(e) =>
                      handleProfileUpdate("email", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone' className='flex items-center'>
                    <Phone className='w-4 h-4 mr-1' />
                    {t.phone}
                  </Label>
                  <Input
                    id='phone'
                    value={profileData.phone}
                    onChange={(e) =>
                      handleProfileUpdate("phone", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='mobile' className='flex items-center'>
                    <Phone className='w-4 h-4 mr-1' />
                    {t.mobile}
                  </Label>
                  <Input
                    id='mobile'
                    value={profileData.mobile}
                    onChange={(e) =>
                      handleProfileUpdate("mobile", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='location' className='flex items-center'>
                    <MapPin className='w-4 h-4 mr-1' />
                    {t.location}
                  </Label>
                  <Input
                    id='location'
                    value={profileData.location}
                    onChange={(e) =>
                      handleProfileUpdate("location", e.target.value)
                    }
                    disabled={!isEditing}
                    className={isEditing ? "border-blue-300" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className='border-0 shadow-lg bg-white/80 backdrop-blur-sm'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Bell className='w-5 h-5 mr-2' />
                {t.notifications}
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>{t.emailNotifications}</Label>
                  <div className='text-sm text-gray-500'>
                    Receive notifications via email
                  </div>
                </div>
                <Switch
                  checked={profileData.notificationSettings.emailNotifications}
                  onCheckedChange={() =>
                    handleNotificationChange("emailNotifications")
                  }
                />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>{t.pushNotifications}</Label>
                  <div className='text-sm text-gray-500'>
                    Receive push notifications in browser
                  </div>
                </div>
                <Switch
                  checked={profileData.notificationSettings.pushNotifications}
                  onCheckedChange={() =>
                    handleNotificationChange("pushNotifications")
                  }
                />
              </div>
              {/* SMS Notifications 
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label className='text-base'>{t.smsNotifications}</Label>
                  <div className='text-sm text-gray-500'>
                    Receive notifications via SMS
                  </div>
                </div>
                <Switch
                  checked={profileData.notificationSettings.smsNotifications}
                  onCheckedChange={() =>
                    handleNotificationChange("smsNotifications")
                  }
                />
              </div>*/}
            </CardContent>
          </Card>

          {/* Save Changes Button */}
          {isEditing && (
            <div className='flex justify-end'>
              <Button
                onClick={handleSaveChanges}
                size='lg'
                className='px-8'
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className='w-4 h-4 mr-2' />
                    {t.saveChanges}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
