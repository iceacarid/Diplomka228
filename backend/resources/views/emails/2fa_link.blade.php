<!DOCTYPE html>
<html lang="ru" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>{{ $subject }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');
    body { margin: 0; padding: 0; background-color: #07071a; }
    * { box-sizing: border-box; }
    .email-body { font-family: 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
    .logo-text  { font-family: 'Montserrat', 'Arial Black', Arial, sans-serif; }
    .cta-btn:hover { opacity: 0.9; }
    @media only screen and (max-width: 600px) {
      .card { border-radius: 0 !important; }
      .card-pad { padding: 28px 20px !important; }
      .cta-btn { font-size: 13px !important; padding: 14px 24px !important; }
    }
  </style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:#07071a;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#07071a;">
  <tr>
    <td align="center" style="padding: 48px 16px 56px;">

      {{-- ───── CARD ───── --}}
      <table class="card" width="100%" cellpadding="0" cellspacing="0" border="0"
             style="max-width:560px; background-color:#0d0d24; border-radius:16px;
                    border:1px solid rgba(240,165,0,0.20); overflow:hidden;">

        {{-- Gold top accent bar --}}
        <tr>
          <td style="height:4px; background: linear-gradient(90deg, #c47d00 0%, #f0a500 50%, #c47d00 100%); line-height:4px; font-size:4px;">&nbsp;</td>
        </tr>

        {{-- ── HEADER ── --}}
        <tr>
          <td style="padding: 32px 40px 28px; border-bottom: 1px solid rgba(255,255,255,0.06);">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span class="logo-text"
                        style="font-family:'Montserrat','Arial Black',Arial,sans-serif;
                               font-size:26px; font-weight:900; letter-spacing:0.14em;
                               text-transform:uppercase; color:#ffffff;">ФУРА</span><span
                        class="logo-text"
                        style="font-family:'Montserrat','Arial Black',Arial,sans-serif;
                               font-size:26px; font-weight:900; letter-spacing:0.14em;
                               text-transform:uppercase; color:#f0a500;">ЕДЕТ</span>
                </td>
              </tr>
              <tr>
                <td style="padding-top:4px;">
                  <span style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                               font-size:9px; font-weight:600; letter-spacing:0.32em;
                               text-transform:uppercase; color:rgba(240,165,0,0.45);">
                    LOGISTICS PLATFORM
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {{-- ── BODY ── --}}
        <tr>
          <td class="card-pad" style="padding: 36px 40px 32px;">

            {{-- Tag --}}
            <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
              <tr>
                <td style="background:rgba(240,165,0,0.12); border:1px solid rgba(240,165,0,0.30);
                            border-radius:20px; padding:4px 12px;">
                  <span style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                               font-size:10px; font-weight:600; letter-spacing:0.18em;
                               text-transform:uppercase; color:#f0a500;">
                    Двухфакторная аутентификация
                  </span>
                </td>
              </tr>
            </table>

            {{-- Title --}}
            <p style="font-family:'Montserrat','Arial Black',Arial,sans-serif;
                      margin:0 0 8px; font-size:22px; font-weight:800;
                      color:#ffffff; line-height:1.3; letter-spacing:0.01em;">
              {{ $action === 'enable' ? 'Включение' : 'Отключение' }} 2FA
            </p>
            <p style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                      margin:0 0 32px; font-size:14px; font-weight:400;
                      color:rgba(255,255,255,0.55); line-height:1.65;">
              Здравствуйте, <strong style="color:#ffffff; font-weight:600;">{{ $name }}</strong>!
              Нажмите кнопку ниже, чтобы подтвердить
              <strong style="color:#ffffff; font-weight:600;">{{ $action === 'enable' ? 'включение' : 'отключение' }}</strong>
              двухфакторной аутентификации.
            </p>

            {{-- ── CTA BUTTON ── --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a class="cta-btn" href="{{ $confirmUrl }}"
                     style="font-family:'Montserrat','Arial Black',Arial,sans-serif;
                            display:inline-block; background:#f0a500; color:#07071a;
                            font-size:14px; font-weight:800; letter-spacing:0.10em;
                            text-transform:uppercase; text-decoration:none;
                            padding:16px 44px; border-radius:10px; line-height:1;">
                    {{ $action === 'enable' ? 'Включить 2FA' : 'Отключить 2FA' }}
                  </a>
                </td>
              </tr>
            </table>

            {{-- Timer notice --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(255,255,255,0.03); border-left:3px solid rgba(240,165,0,0.5);
                          border-radius:0 8px 8px 0; margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;">
                  <p style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                            margin:0; font-size:12px; color:rgba(255,255,255,0.45); line-height:1.6;">
                    Ссылка действительна&nbsp;<strong style="color:rgba(240,165,0,0.80);">{{ $minutes }}&nbsp;минут</strong>.
                    Если вы не делали этот запрос&nbsp;— просто проигнорируйте письмо.
                  </p>
                </td>
              </tr>
            </table>

            {{-- Divider --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
              <tr>
                <td style="height:1px; background:rgba(255,255,255,0.07); font-size:1px; line-height:1px;">&nbsp;</td>
              </tr>
            </table>

            {{-- Fallback link --}}
            <p style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                      margin:0; font-size:11px; color:rgba(255,255,255,0.28); line-height:1.7;">
              Если кнопка не работает, скопируйте ссылку в адресную строку браузера:<br>
              <span style="color:rgba(240,165,0,0.45); font-family:'Courier New',Courier,monospace;
                           font-size:10px; word-break:break-all;">{{ $confirmUrl }}</span>
            </p>

          </td>
        </tr>

        {{-- ── FOOTER ── --}}
        <tr>
          <td style="background:#090919; border-top:1px solid rgba(255,255,255,0.05);
                     padding:22px 40px;">
            <p style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                      margin:0; font-size:11px; font-weight:400;
                      color:rgba(255,255,255,0.20); text-align:center; line-height:1.7;">
              &copy;&nbsp;{{ date('Y') }}&nbsp;ФураЕдет&nbsp;&mdash; Платформа управления логистикой<br>
              Это письмо отправлено автоматически, отвечать на него не нужно.
            </p>
          </td>
        </tr>

      </table>
      {{-- /CARD --}}

    </td>
  </tr>
</table>

</body>
</html>
