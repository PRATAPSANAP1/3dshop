import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Phone, Save, ShieldCheck, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageTransition from "@/components/PageTransition";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // OTP Password state
  const [otpFlowStep, setOtpFlowStep] = useState<0 | 1>(0); // 0 = not started, 1 = otp sent
  const [otpInput, setOtpInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isProcessingOtp, setIsProcessingOtp] = useState(false);

  const mobileNumber = user?.mobile || '';

  const handleRequestOtp = async () => {
    if (!mobileNumber) {
      toast({ variant: "destructive", title: "Error", description: "Please add a mobile number in your profile and save it first." });
      return;
    }
    setIsProcessingOtp(true);
    try {
      const { data } = await api.post('/auth/profile/request-password-otp');
      setOtpFlowStep(1);
      toast({ title: "OTP Sent", description: data.message });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to send OTP." });
    } finally {
      setIsProcessingOtp(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!otpInput || !newPassword) {
      toast({ variant: "destructive", title: "Missing Fields", description: "OTP and new password are required." });
      return;
    }
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters long." });
      return;
    }
    setIsProcessingOtp(true);
    try {
      await api.post('/auth/profile/update-password-otp', { otp: otpInput, newPassword });
      setOtpFlowStep(0);
      setOtpInput('');
      setNewPassword('');
      toast({ title: "Success", description: "Your password has been updated." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.response?.data?.message || "Failed to update password." });
    } finally {
      setIsProcessingOtp(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 px-2 sm:px-0">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm shrink-0">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">Global Settings</h1>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            
            {/* OTP Security Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-slate-200 bg-white p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500 shadow-sm shrink-0">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="font-heading text-xl font-bold text-slate-900">Security & Authentication</h3>
                  <p className="text-sm font-semibold text-slate-400">Update your password using mobile OTP.</p>
                </div>
              </div>

              {otpFlowStep === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-slate-600">
                    To change your password securely, we will send an OTP to your registered mobile number: 
                    <span className="text-slate-900 mx-1">{mobileNumber || 'Not set'}</span>
                  </p>
                  <Button 
                    onClick={handleRequestOtp} 
                    disabled={isProcessingOtp || !mobileNumber}
                    className="h-12 px-8 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    {isProcessingOtp ? "Sending..." : "Send OTP to Mobile"}
                  </Button>
                  {!mobileNumber && <p className="text-xs text-rose-500 font-bold mt-2">Please add a mobile number in your profile and save it first.</p>}
                </div>
              ) : (
                <div className="space-y-4 border border-slate-100 p-6 rounded-2xl bg-slate-50/50">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">Enter 6-digit OTP</label>
                    <Input 
                      value={otpInput} 
                      onChange={e => setOtpInput(e.target.value)} 
                      placeholder="123456" 
                      className="h-12 rounded-xl bg-white border-slate-200 text-lg font-mono tracking-widest" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 ml-1">New Password</label>
                    <Input 
                      type="password"
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      className="h-12 rounded-xl bg-white border-slate-200" 
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setOtpFlowStep(0)} 
                      className="h-12 px-6 rounded-xl font-bold border-slate-200"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdatePassword} 
                      disabled={isProcessingOtp || !otpInput || !newPassword}
                      className="h-12 flex-1 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {isProcessingOtp ? "Verifying..." : "Verify OTP & Update Password"}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

          </div>
          
          <div className="space-y-6">
            <motion.div
               initial={{ opacity: 0, y: 12 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="font-heading text-lg font-bold text-slate-900 mb-4">Account Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">Role</span>
                  <span className="text-sm font-black text-primary uppercase tracking-wider">{user?.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-500">Mobile Verified</span>
                  <span className={`text-sm font-black uppercase tracking-wider ${mobileNumber ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {mobileNumber ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;
