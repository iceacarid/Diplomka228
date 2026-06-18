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
    @media only screen and (max-width: 600px) {
      .card { border-radius: 0 !important; }
      .card-pad { padding: 28px 20px !important; }
      .code-digit { font-size: 30px !important; letter-spacing: 0.15em !important; }
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
                    @switch($purpose)
                      @case('registration')Подтверждение регистрации@break
                      @case('two_factor')Двухфакторная аутентификация@break
                      @default Восстановление пароля
                    @endswitch
                  </span>
                </td>
              </tr>
            </table>

            {{-- Greeting --}}
            <p style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                      margin:0 0 8px; font-size:22px; font-weight:700;
                      color:#ffffff; line-height:1.3;">
              Здравствуйте, {{ $name }}!
            </p>
            <p style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                      margin:0 0 32px; font-size:14px; font-weight:400;
                      color:rgba(255,255,255,0.55); line-height:1.65;">
              @switch($purpose)
                @case('registration')Введите код ниже, чтобы завершить создание аккаунта в ФураЕдет.@break
                @case('two_factor')Введите этот код для подтверждения входа в систему.@break
                @default Используйте код ниже, чтобы сбросить пароль аккаунта.
              @endswitch
            </p>

            {{-- ── CODE BLOCK ── --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td align="center">
                  <table cellpadding="0" cellspacing="0" border="0"
                         style="background:#111130; border:1px solid rgba(240,165,0,0.28);
                                border-radius:12px; padding:0;">
                    <tr>
                      <td align="center" style="padding:10px 24px 6px;">
                        <span style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                                     font-size:9px; font-weight:600; letter-spacing:0.25em;
                                     text-transform:uppercase; color:rgba(255,255,255,0.30);">
                          КОД ПОДТВЕРЖДЕНИЯ
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:4px 32px 18px;">
                        <span class="code-digit"
                              style="font-family:'Montserrat','Arial Black',Arial,sans-serif;
                                     font-size:46px; font-weight:900; letter-spacing:0.28em;
                                     color:#f0a500; display:block;">
                          {{ $code }}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:0 24px 14px;">
                        {{-- Thin gold divider --}}
                        <table width="60" cellpadding="0" cellspacing="0" border="0">
                          <tr><td style="height:1px;background:rgba(240,165,0,0.25);font-size:1px;line-height:1px;">&nbsp;</td></tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding:0 24px 16px;">
                        <span style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                                     font-size:11px; font-weight:500; color:rgba(255,255,255,0.35);">
                          Действителен&nbsp;<strong style="color:rgba(240,165,0,0.70);">{{ $minutes }}&nbsp;минут</strong>
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            {{-- Security notice --}}
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(255,255,255,0.03); border-left:3px solid rgba(240,165,0,0.5);
                          border-radius:0 8px 8px 0;">
              <tr>
                <td style="padding:12px 16px;">
                  <p style="font-family:'Inter','Segoe UI',Arial,sans-serif;
                            margin:0; font-size:12px; font-weight:400;
                            color:rgba(255,255,255,0.40); line-height:1.6;">
                    @switch($purpose)
                      @case('registration')Если вы не регистрировались в ФураЕдет&nbsp;— проигнорируйте письмо.@break
                      @case('two_factor')Если вы не входили в ФураЕдет&nbsp;— немедленно смените пароль.@break
                      @default Если вы не запрашивали сброс пароля&nbsp;— проигнорируйте письмо.
                    @endswitch
                  </p>
                </td>
              </tr>
            </table>

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
