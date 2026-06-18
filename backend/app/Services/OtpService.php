<?php

namespace App\Services;

use App\Models\EmailOtp;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class OtpService
{
    const EXPIRY_MINUTES = 10;

    public function send(User $user, string $purpose): string
    {
        // Удаляем старые неиспользованные коды
        EmailOtp::where('user_id', $user->id)
            ->where('purpose', $purpose)
            ->where('is_used', false)
            ->delete();

        $code = EmailOtp::generateCode();
        EmailOtp::create([
            'user_id'    => $user->id,
            'code'       => $code,
            'purpose'    => $purpose,
            'expires_at' => Carbon::now()->addMinutes(self::EXPIRY_MINUTES),
            'is_used'    => false,
        ]);

        $subject = $this->getSubject($purpose);

        Mail::send('emails.otp', [
            'name'    => $user->name,
            'code'    => $code,
            'purpose' => $purpose,
            'minutes' => self::EXPIRY_MINUTES,
            'subject' => $subject,
        ], function ($message) use ($user, $subject) {
            $message->to($user->email)->subject($subject);
        });

        return $code;
    }

    public function verify(User $user, string $code, string $purpose): ?EmailOtp
    {
        return EmailOtp::where('user_id', $user->id)
            ->where('code', $code)
            ->where('purpose', $purpose)
            ->where('is_used', false)
            ->where('expires_at', '>', Carbon::now())
            ->orderByDesc('created_at')
            ->first();
    }

    private function getSubject(string $purpose): string
    {
        return match($purpose) {
            'registration'   => 'ФураЕдет — подтверждение регистрации',
            'two_factor'     => 'ФураЕдет — код для входа (2FA)',
            'password_reset' => 'ФураЕдет — восстановление пароля',
            default          => 'ФураЕдет — код подтверждения',
        };
    }


}
