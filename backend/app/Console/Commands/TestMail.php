<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestMail extends Command
{
    protected $signature = 'mail:test {email}';
    protected $description = 'Test SMTP configuration';

    public function handle()
    {
        $email = $this->argument('email');
        $this->info("Отправляем письмо на {$email}...");

        try {
            Mail::raw('Тест SMTP ФураЕдет. Если вы видите это письмо — почта работает!', function ($m) use ($email) {
                $m->to($email)->subject('Тест ФураЕдет');
            });
            $this->info('Письмо успешно отправлено!');
        } catch (\Exception $e) {
            $this->error('Ошибка: ' . $e->getMessage());
        }
    }
}
