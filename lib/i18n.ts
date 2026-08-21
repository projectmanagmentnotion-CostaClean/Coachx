export const supportedLocales = ["es", "ca", "en", "de"] as const;
export type Locale = (typeof supportedLocales)[number];

export const localeCookieName = "athlexforce-locale";
export const localeStorageKey = "athlexforce-locale-v1";

type MessageTree = {
  common: {
    back: string;
    continue: string;
    skip: string;
    save: string;
    retry: string;
    help: string;
    close: string;
    edit: string;
    review: string;
    apply: string;
    approve: string;
    reject: string;
    startOnboarding: string;
    startWorkout: string;
    viewWorkout: string;
    openSettings: string;
    signOut: string;
    loading: string;
    language: string;
    primary: string;
    secondary: string;
    profile: string;
    program: string;
    today: string;
    calendar: string;
    nutrition: string;
    progress: string;
    coachPanel: string;
    athleteWorkspace: string;
    coachWorkspace: string;
    switchWorkspace: string;
    dashboard: string;
    athletes: string;
    reviews: string;
    notifications: string;
    settings: string;
    unauthorized: string;
    networkFailure: string;
    error: string;
    success: string;
    noData: string;
  };
  locale: {
    es: string;
    ca: string;
    en: string;
    de: string;
  };
  nav: {
    today: string;
    calendar: string;
    nutrition: string;
    progress: string;
    profile: string;
  };
  auth: {
    entryTitle: string;
    entrySubtitle: string;
    signIn: string;
    signUp: string;
    logout: string;
    signedInAthlete: string;
    entryWelcomeBack: string;
    entryRestoringSession: string;
    entrySession: string;
    entryCheckingSession: string;
    entrySessionReady: string;
    entryPlanWaiting: string;
    entryBootErrorTitle: string;
    entryBootErrorSubtitle: string;
    entryBootErrorTryAgain: string;
    entryBootErrorSignIn: string;
    entryAthleteHeading: string;
    entrySignInHeading: string;
    continueWithGoogle: string;
    connectingGoogle: string;
    entryDivider: string;
    email: string;
    password: string;
    showPassword: string;
    hidePassword: string;
    entryKeepSignedIn: string;
    entrySignInButton: string;
    entryForgotPassword: string;
    entryNoAccountYet: string;
    entryCreateAccount: string;
    entryAlreadyHaveAccount: string;
    entrySignUpHelper: string;
    entrySignInHelper: string;
    entryPasswordUpdated: string;
    entrySignInLinkError: string;
    entryGoogleCancelled: string;
    entryStatusReady: string;
    entryStatusUnavailable: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    introTitle: string;
    introSubtitle: string;
    introBasicsTitle: string;
    introBasicsCaption: string;
    whatWeSetUp: string;
    profileTitle: string;
    profileSubtitle: string;
    profileQuestion: string;
    profileCaption: string;
    goalsTitle: string;
    goalsSubtitle: string;
    goalsQuestion: string;
    goalsCaption: string;
    trainingExperienceTitle: string;
    trainingExperienceSubtitle: string;
    trainingExperienceSummary: string;
    trainingPreferencesTitle: string;
    trainingPreferencesSubtitle: string;
    trainingPreferencesCaption: string;
    scheduleTitle: string;
    scheduleSubtitle: string;
    healthTitle: string;
    healthSubtitle: string;
    nutritionTitle: string;
    nutritionSubtitle: string;
    baselineTitle: string;
    baselineSubtitle: string;
    reviewTitle: string;
    reviewSubtitle: string;
    buildingPlanTitle: string;
    buildingPlanSubtitle: string;
    planReadyTitle: string;
    planReadySubtitle: string;
    programTitle: string;
    programSubtitle: string;
    identityGatewayTitle: string;
    identityGatewaySubtitle: string;
    identityGatewayIndependentTitle: string;
    identityGatewayIndependentCopy: string;
    identityGatewayCoachManagedTitle: string;
    identityGatewayCoachManagedCopy: string;
    identityGatewayCoachTitle: string;
    identityGatewayCoachCopy: string;
    identityGatewayInviteTitle: string;
    identityGatewayInviteCopy: string;
    identityGatewayInvitePlaceholder: string;
    identityGatewayInviteButton: string;
    identityGatewayInviteSuccess: string;
    identityGatewayInviteError: string;
    identityGatewayContinue: string;
    identityGatewayPendingTitle: string;
    identityGatewayPendingCopy: string;
    identityGatewayCoachConnected: string;
  };
  profile: {
    hubTitle: string;
    hubDetail: string;
    provisionalHub: string;
    signedInAs: string;
    currentPlan: string;
    active: string;
    proposed: string;
    daysPerWeek: string;
    duration: string;
    location: string;
    profileEditing: string;
    notifications: string;
    notificationsDetail: string;
    programOverview: string;
    developmentMode: string;
    settingsDetail: string;
    security: string;
    securityDetail: string;
    workspaceMode: string;
    selfManaged: string;
    coachManaged: string;
    yourCoach: string;
    planSupervised: string;
    coachConnected: string;
    coachPending: string;
    openCoachWorkspace: string;
    switchToAthleteWorkspace: string;
    profileSaved: string;
    programUpdatePending: string;
    noPendingProgramUpdates: string;
  };
  coach: {
    accessDeniedTitle: string;
    accessDeniedCopy: string;
    dashboardTitle: string;
    dataNotReadyTitle: string;
    dataNotReadyCopy: string;
    assignedAthletesOnly: string;
    needsAttention: string;
    quickLinks: string;
    athletes: string;
    reviews: string;
    profile: string;
    profileDetail: string;
    pendingTitle: string;
    pendingCopy: string;
    pendingBackToAthlete: string;
    pendingRequestReceived: string;
    pendingRequestDetail: string;
  };
  calendar: {
    title: string;
    previousMonth: string;
    nextMonth: string;
    nutrition: string;
    cardioHabits: string;
    viewDay: string;
    monthFallback: string;
  };
  today: {
    restDay: string;
    recoveryDay: string;
    nextWorkout: string;
    targetZones: string;
    primary: string;
    secondary: string;
    readyTomorrow: string;
    duration: string;
    calories: string;
    cardio: string;
    volume: string;
    sets: string;
    movements: string;
    posteriorChainEmphasis: string;
  };
  program: {
    overview: string;
    myProgram: string;
    weeklyStructure: string;
    workoutTemplates: string;
    keyMovements: string;
    progression: string;
    nutrition: string;
    cardio: string;
    recovery: string;
    habits: string;
    checkIn: string;
    reviewTimeline: string;
    recentAdjustments: string;
  };
};

const messages: Record<Locale, MessageTree> = {
  en: {
    common: {
      back: "Back",
      continue: "Continue",
      skip: "Skip",
      save: "Save",
      retry: "Retry",
      help: "Help",
      close: "Close",
      edit: "Edit",
      review: "Review",
      apply: "Apply",
      approve: "Approve",
      reject: "Reject",
      startOnboarding: "Start onboarding",
      startWorkout: "Start workout",
      viewWorkout: "View Workout",
      openSettings: "Open Settings",
      signOut: "Sign out",
      loading: "Loading",
      language: "Language",
      primary: "Primary",
      secondary: "Secondary",
      profile: "Profile",
      program: "Program",
      today: "Today",
      calendar: "Calendar",
      nutrition: "Nutrition",
      progress: "Progress",
      coachPanel: "Coach Panel",
      athleteWorkspace: "Athlete workspace",
      coachWorkspace: "Coach workspace",
      switchWorkspace: "Switch workspace",
      dashboard: "Dashboard",
      athletes: "Athletes",
      reviews: "Reviews",
      notifications: "Notifications",
      settings: "Settings",
      unauthorized: "Unauthorized",
      networkFailure: "Network failure",
      error: "Error",
      success: "Success",
      noData: "No data"
    },
    locale: { es: "Spanish", ca: "Catalan", en: "English", de: "German" },
    nav: { today: "Today", calendar: "Calendar", nutrition: "Nutrition", progress: "Progress", profile: "Profile" },
    auth: {
      entryTitle: "AthlexForce",
      entrySubtitle: "A premium training experience for athletes and coaches",
      signIn: "Sign in",
      signUp: "Sign up",
      logout: "Logout",
      signedInAthlete: "Signed in athlete",
      entryWelcomeBack: "Welcome back",
      entryRestoringSession: "Restoring your secure session.",
      entrySession: "Session",
      entryCheckingSession: "Checking your saved sign-in state.",
      entrySessionReady: "You will be routed to the right place once the session is ready.",
      entryPlanWaiting: "Your plan is waiting.",
      entryBootErrorTitle: "We couldn't restore your session.",
      entryBootErrorSubtitle: "Try again, or continue with a fresh sign-in.",
      entryBootErrorTryAgain: "Try again",
      entryBootErrorSignIn: "Sign in",
      entryAthleteHeading: "Athlete entry",
      entrySignInHeading: "Sign in",
      continueWithGoogle: "Continue with Google",
      connectingGoogle: "Connecting...",
      entryDivider: "or",
      email: "Email",
      password: "Password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      entryKeepSignedIn: "Keep me signed in",
      entrySignInButton: "Sign in",
      entryForgotPassword: "Forgot password?",
      entryNoAccountYet: "No account yet?",
      entryCreateAccount: "Create account",
      entryAlreadyHaveAccount: "Already have an account? Sign in",
      entrySignUpHelper: "Create an account with the same secure Google or email sign-in path.",
      entrySignInHelper: "Email sign-in uses the same secure session route as Google.",
      entryPasswordUpdated: "Password updated. Sign in again with your new password.",
      entrySignInLinkError: "The sign-in link could not be completed. Try again.",
      entryGoogleCancelled: "Google sign-in was cancelled. Nothing changed.",
      entryStatusReady: "Sign-in ready.",
      entryStatusUnavailable: "Sign-in unavailable."
    },
    onboarding: {
      title: "Onboarding",
      subtitle: "Build the athlete setup before the plan is revealed.",
      introTitle: "Start with the basics",
      introSubtitle: "Build the athlete setup before the plan is revealed.",
      introBasicsTitle: "Start with the basics",
      introBasicsCaption: "AthlexForce uses one consistent athlete context across profile, goals, training, nutrition, baseline, and the program reveal.",
      whatWeSetUp: "What we'll set up",
      profileTitle: "Profile",
      profileSubtitle: "Name, age, height, weight, and units.",
      profileQuestion: "What should we call you?",
      profileCaption: "Keep the same athlete details through every step.",
      goalsTitle: "Goals",
      goalsSubtitle: "Main goal and ordered priorities.",
      goalsQuestion: "Set the main goal",
      goalsCaption: "Keep the visual language simple. Goal and priorities should read clearly on mobile.",
      trainingExperienceTitle: "Training Experience",
      trainingExperienceSubtitle: "Current frequency, confidence, loads, and movement familiarity.",
      trainingExperienceSummary: "Experience summary",
      trainingPreferencesTitle: "Training Preferences",
      trainingPreferencesSubtitle: "Days, duration, equipment, variety, and rest preferences.",
      trainingPreferencesCaption: "Repeatable anchors",
      scheduleTitle: "Schedule & Lifestyle",
      scheduleSubtitle: "Work pattern, sleep, stress, hydration, and training windows.",
      healthTitle: "Health & Limitations",
      healthSubtitle: "Keep this calm, private, and non-diagnostic.",
      nutritionTitle: "Nutrition Preferences",
      nutritionSubtitle: "Allergies, restrictions, routine, and flexibility.",
      baselineTitle: "Baseline",
      baselineSubtitle: "Measurements and optional private progress photos.",
      reviewTitle: "Final Review",
      reviewSubtitle: "Confirm the profile before the plan is built.",
      buildingPlanTitle: "Building Your Plan",
      buildingPlanSubtitle: "A calm pause while your plan is being prepared.",
      planReadyTitle: "Your Plan is Ready",
      planReadySubtitle: "Phase 1 is ready to review until you begin.",
      programTitle: "Program Overview",
      programSubtitle: "Phase 1, progress, and current structure.",
      identityGatewayTitle: "How will you use AthlexForce?",
      identityGatewaySubtitle: "Pick the path that matches how you train. You can switch later if your access changes.",
      identityGatewayIndependentTitle: "I train on my own",
      identityGatewayIndependentCopy: "I manage my training and nutrition.",
      identityGatewayCoachManagedTitle: "I train with a coach",
      identityGatewayCoachManagedCopy: "My coach manages or supervises my plan.",
      identityGatewayCoachTitle: "I am a coach",
      identityGatewayCoachCopy: "I manage athletes with AthlexForce.",
      identityGatewayInviteTitle: "Have an invite code?",
      identityGatewayInviteCopy: "Paste a secure invitation token to connect a coach relationship.",
      identityGatewayInvitePlaceholder: "Paste invite code",
      identityGatewayInviteButton: "Connect coach",
      identityGatewayInviteSuccess: "Coach connected.",
      identityGatewayInviteError: "That invite code could not be verified.",
      identityGatewayContinue: "Continue",
      identityGatewayPendingTitle: "Coach request received",
      identityGatewayPendingCopy: "Your coach access request is waiting on trusted verification.",
      identityGatewayCoachConnected: "Coach connected."
    },
    profile: {
      hubTitle: "Profile",
      hubDetail: "Profile hub and core settings",
      provisionalHub: "Profile hub and core settings",
      signedInAs: "Signed in as",
      currentPlan: "Current plan",
      active: "Active",
      proposed: "Proposed",
      daysPerWeek: "Days / week",
      duration: "Duration",
      location: "Location",
      profileEditing: "Profile editing",
      notifications: "Notifications",
      notificationsDetail: "Workout, progress, and coaching reminders",
      programOverview: "Program overview",
      developmentMode: "Workspace mode",
      settingsDetail: "Language, training, and account preferences",
      security: "Security",
      securityDetail: "Password, sessions, and account access",
      workspaceMode: "Workspace mode",
      selfManaged: "Self-managed",
      coachManaged: "Coach-managed",
      yourCoach: "Your coach",
      planSupervised: "Plan supervised",
      coachConnected: "Coach connected.",
      coachPending: "Coach connection pending",
      openCoachWorkspace: "Open coach workspace",
      switchToAthleteWorkspace: "Open athlete workspace",
      profileSaved: "profile saved",
      programUpdatePending: "Program update pending",
      noPendingProgramUpdates: "No pending program updates"
    },
    coach: {
      accessDeniedTitle: "Access denied",
      accessDeniedCopy: "This account is not set up for coach access yet.",
      dashboardTitle: "Coach dashboard",
      dataNotReadyTitle: "Coach data is not ready yet",
      dataNotReadyCopy: "Coach data is not ready in this workspace yet.",
      assignedAthletesOnly: "Assigned athletes only. Review the athletes that need attention first.",
      needsAttention: "Needs attention",
      quickLinks: "Quick links",
      athletes: "Athletes",
      reviews: "Reviews",
      profile: "Profile",
      profileDetail: "Identity and current plan",
      pendingTitle: "Coach access pending",
      pendingCopy: "This account has a coach request pending trusted verification.",
      pendingBackToAthlete: "Back to athlete workspace",
      pendingRequestReceived: "REQUEST RECEIVED",
      pendingRequestDetail: "We will unlock the coach workspace after verification."
    },
    calendar: {
      title: "Calendar",
      previousMonth: "Previous month",
      nextMonth: "Next month",
      nutrition: "Nutrition",
      cardioHabits: "Cardio & Habits",
      viewDay: "View Day",
      monthFallback: "Current month"
    },
    today: {
      restDay: "Rest Day",
      recoveryDay: "Recovery Day",
      nextWorkout: "Next Workout",
      targetZones: "Target Zones",
      primary: "Primary",
      secondary: "Secondary",
      readyTomorrow: "Ready tomorrow",
      duration: "Duration",
      calories: "Calories",
      cardio: "Cardio",
      volume: "Volume",
      sets: "Sets",
      movements: "Movements",
      posteriorChainEmphasis: "Posterior chain emphasis"
    },
    program: {
      overview: "Program Overview",
      myProgram: "My Program",
      weeklyStructure: "Weekly structure",
      workoutTemplates: "Workout templates",
      keyMovements: "Key movements",
      progression: "Progression",
      nutrition: "Nutrition",
      cardio: "Cardio",
      recovery: "Recovery",
      habits: "Habits",
      checkIn: "Check-in",
      reviewTimeline: "Review timeline",
      recentAdjustments: "Recent adjustments"
    }
  },
  es: {
    common: {
      back: "Atrás",
      continue: "Continuar",
      skip: "Saltar",
      save: "Guardar",
      retry: "Reintentar",
      help: "Ayuda",
      close: "Cerrar",
      edit: "Editar",
      review: "Revisar",
      apply: "Aplicar",
      approve: "Aprobar",
      reject: "Rechazar",
      startOnboarding: "Empezar onboarding",
      startWorkout: "Empezar entrenamiento",
      viewWorkout: "Ver entrenamiento",
      openSettings: "Abrir ajustes",
      signOut: "Cerrar sesión",
      loading: "Cargando",
      language: "Idioma",
      primary: "Principal",
      secondary: "Secundaria",
      profile: "Perfil",
      program: "Programa",
      today: "Hoy",
      calendar: "Calendario",
      nutrition: "Nutrición",
      progress: "Progreso",
      coachPanel: "Panel de coach",
      athleteWorkspace: "Espacio de atleta",
      coachWorkspace: "Espacio de coach",
      switchWorkspace: "Cambiar espacio",
      dashboard: "Panel",
      athletes: "Atletas",
      reviews: "Revisiones",
      notifications: "Notificaciones",
      settings: "Ajustes",
      unauthorized: "Sin acceso",
      networkFailure: "Fallo de red",
      error: "Error",
      success: "Correcto",
      noData: "Sin datos"
    },
    locale: { es: "Español", ca: "Català", en: "Inglés", de: "Alemán" },
    nav: { today: "Hoy", calendar: "Calendario", nutrition: "Nutrición", progress: "Progreso", profile: "Perfil" },
    auth: { entryTitle: "AthlexForce", entrySubtitle: "Una experiencia premium para atletas y coaches", signIn: "Entrar", signUp: "Crear cuenta", logout: "Salir", signedInAthlete: "Atleta autenticado", entryWelcomeBack: "Bienvenido de nuevo", entryRestoringSession: "Restaurando tu sesión segura.", entrySession: "Sesión", entryCheckingSession: "Comprobando tu estado de inicio guardado.", entrySessionReady: "Se te llevará al lugar correcto cuando la sesión esté lista.", entryPlanWaiting: "Tu plan te está esperando.", entryBootErrorTitle: "No hemos podido restaurar tu sesión.", entryBootErrorSubtitle: "Inténtalo de nuevo o continúa con un inicio limpio.", entryBootErrorTryAgain: "Probar otra vez", entryBootErrorSignIn: "Entrar", entryAthleteHeading: "Entrada de atleta", entrySignInHeading: "Iniciar sesión", continueWithGoogle: "Continuar con Google", connectingGoogle: "Conectando...", entryDivider: "o", email: "Correo electrónico", password: "Contraseña", showPassword: "Mostrar contraseña", hidePassword: "Ocultar contraseña", entryKeepSignedIn: "Mantener la sesión iniciada", entrySignInButton: "Entrar", entryForgotPassword: "¿Has olvidado la contraseña?", entryNoAccountYet: "¿Todavía no tienes cuenta?", entryCreateAccount: "Crear cuenta", entryAlreadyHaveAccount: "¿Ya tienes cuenta? Inicia sesión", entrySignUpHelper: "Crea una cuenta con la misma ruta segura de Google o correo.", entrySignInHelper: "El correo usa la misma ruta de sesión segura que Google.", entryPasswordUpdated: "Contraseña actualizada. Inicia sesión de nuevo con tu nueva contraseña.", entrySignInLinkError: "No se ha podido completar el enlace de inicio de sesión. Inténtalo de nuevo.", entryGoogleCancelled: "El inicio con Google se ha cancelado. No se ha cambiado nada.", entryStatusReady: "Inicio de sesión listo.", entryStatusUnavailable: "Inicio de sesión no disponible." },
    onboarding: {
      title: "Onboarding",
      subtitle: "Configura el atleta antes de revelar el plan.",
      introTitle: "Empieza por lo básico",
      introSubtitle: "Configura el atleta antes de revelar el plan.",
      introBasicsTitle: "Empieza por lo básico",
      introBasicsCaption: "AthlexForce usa un único contexto de atleta para perfil, objetivos, entrenamiento, nutrición, baseline y la revelación del plan.",
      whatWeSetUp: "Qué vamos a configurar",
      profileTitle: "Perfil",
      profileSubtitle: "Nombre, edad, altura, peso y unidades.",
      profileQuestion: "¿Cómo te llamamos?",
      profileCaption: "Mantén los mismos datos del atleta en cada paso.",
      goalsTitle: "Objetivos",
      goalsSubtitle: "Objetivo principal y prioridades ordenadas.",
      goalsQuestion: "Define el objetivo principal",
      goalsCaption: "Mantén el lenguaje visual simple. El objetivo y las prioridades deben leerse bien en móvil.",
      trainingExperienceTitle: "Experiencia de entrenamiento",
      trainingExperienceSubtitle: "Frecuencia, confianza, cargas y familiaridad con movimientos.",
      trainingExperienceSummary: "Resumen de experiencia",
      trainingPreferencesTitle: "Preferencias de entrenamiento",
      trainingPreferencesSubtitle: "Días, duración, equipo, variedad y descanso.",
      trainingPreferencesCaption: "Anclas repetibles",
      scheduleTitle: "Horario y estilo de vida",
      scheduleSubtitle: "Trabajo, sueño, estrés, hidratación y ventanas de entrenamiento.",
      healthTitle: "Salud y limitaciones",
      healthSubtitle: "Mantén esto tranquilo, privado y sin diagnóstico.",
      nutritionTitle: "Preferencias de nutrición",
      nutritionSubtitle: "Alergias, restricciones, rutina y flexibilidad.",
      baselineTitle: "Baseline",
      baselineSubtitle: "Medidas y fotos privadas opcionales.",
      reviewTitle: "Revisión final",
      reviewSubtitle: "Confirma el perfil antes de construir el plan.",
      buildingPlanTitle: "Construyendo tu plan",
      buildingPlanSubtitle: "Una pausa tranquila mientras tu plan se prepara.",
      planReadyTitle: "Tu plan está listo",
      planReadySubtitle: "La Fase 1 está lista para revisar hasta que empieces.",
      programTitle: "Resumen del programa",
      programSubtitle: "Fase 1, progreso y estructura actual.",
      identityGatewayTitle: "¿Cómo vas a usar AthlexForce?",
      identityGatewaySubtitle: "Elige la ruta que encaje con tu forma de entrenar. Podrás cambiarla más tarde si tu acceso cambia.",
      identityGatewayIndependentTitle: "Entreno por mi cuenta",
      identityGatewayIndependentCopy: "Gestiono yo mismo mi entrenamiento y nutrición.",
      identityGatewayCoachManagedTitle: "Entreno con un coach",
      identityGatewayCoachManagedCopy: "Mi coach supervisa o gestiona mi plan.",
      identityGatewayCoachTitle: "Soy coach",
      identityGatewayCoachCopy: "Gestiono atletas con AthlexForce.",
      identityGatewayInviteTitle: "¿Tienes un código de invitación?",
      identityGatewayInviteCopy: "Pega un token seguro para conectar una relación con coach.",
      identityGatewayInvitePlaceholder: "Pega el código",
      identityGatewayInviteButton: "Conectar coach",
      identityGatewayInviteSuccess: "Coach conectado.",
      identityGatewayInviteError: "No se ha podido verificar ese código de invitación.",
      identityGatewayContinue: "Continuar",
      identityGatewayPendingTitle: "Solicitud de coach recibida",
      identityGatewayPendingCopy: "Tu solicitud de acceso de coach está pendiente de verificación confiable.",
      identityGatewayCoachConnected: "Coach conectado."
    },
    profile: {
      hubTitle: "Perfil",
      hubDetail: "Centro de perfil y ajustes base",
      provisionalHub: "Centro de perfil y ajustes base",
      signedInAs: "Sesión iniciada como",
      currentPlan: "Plan actual",
      active: "Activo",
      proposed: "Propuesto",
      daysPerWeek: "Días / semana",
      duration: "Duración",
      location: "Ubicación",
      profileEditing: "Edición de perfil",
      notifications: "Notificaciones",
      notificationsDetail: "Recordatorios de entrenamiento, progreso y coaching",
      programOverview: "Resumen del programa",
      developmentMode: "Modo de trabajo",
      settingsDetail: "Idioma, entrenamiento y preferencias de cuenta",
      security: "Seguridad",
      securityDetail: "Contraseña, sesiones y acceso a la cuenta",
      workspaceMode: "Modo de espacio",
      selfManaged: "Autogestionado",
      coachManaged: "Con coach",
      yourCoach: "Tu coach",
      planSupervised: "Plan supervisado",
      coachConnected: "Coach conectado.",
      coachPending: "Conexión con coach pendiente",
      openCoachWorkspace: "Abrir espacio de coach",
      switchToAthleteWorkspace: "Abrir espacio de atleta",
      profileSaved: "perfil guardado",
      programUpdatePending: "Actualización del programa pendiente",
      noPendingProgramUpdates: "Sin actualizaciones pendientes"
    },
    coach: {
      accessDeniedTitle: "Acceso denegado",
      accessDeniedCopy: "Esta cuenta todavía no tiene acceso de coach.",
      dashboardTitle: "Panel de coach",
      dataNotReadyTitle: "Los datos del coach aún no están listos",
      dataNotReadyCopy: "Los datos de coach todavía no están listos en este espacio.",
      assignedAthletesOnly: "Solo atletas asignados. Revisa primero los que necesitan atención.",
      needsAttention: "Necesita atención",
      quickLinks: "Accesos rápidos",
      athletes: "Atletas",
      reviews: "Revisiones",
      profile: "Perfil",
      profileDetail: "Identidad y plan actual",
      pendingTitle: "Acceso de coach pendiente",
      pendingCopy: "Esta cuenta tiene una solicitud de coach pendiente de verificación confiable.",
      pendingBackToAthlete: "Volver al espacio de atleta",
      pendingRequestReceived: "SOLICITUD RECIBIDA",
      pendingRequestDetail: "Desbloquearemos el espacio de coach después de la verificación."
    },
    calendar: {
      title: "Calendario",
      previousMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      nutrition: "Nutrición",
      cardioHabits: "Cardio y hábitos",
      viewDay: "Ver día",
      monthFallback: "Mes actual"
    },
    today: {
      restDay: "Día de descanso",
      recoveryDay: "Día de recuperación",
      nextWorkout: "Próximo entrenamiento",
      targetZones: "Zonas objetivo",
      primary: "Principal",
      secondary: "Secundaria",
      readyTomorrow: "Listo mañana",
      duration: "Duración",
      calories: "Calorías",
      cardio: "Cardio",
      volume: "Volumen",
      sets: "Series",
      movements: "Movimientos",
      posteriorChainEmphasis: "Énfasis en la cadena posterior"
    },
    program: {
      overview: "Resumen del programa",
      myProgram: "Mi programa",
      weeklyStructure: "Estructura semanal",
      workoutTemplates: "Plantillas de entrenamiento",
      keyMovements: "Movimientos clave",
      progression: "Progresión",
      nutrition: "Nutrición",
      cardio: "Cardio",
      recovery: "Recuperación",
      habits: "Hábitos",
      checkIn: "Check-in",
      reviewTimeline: "Calendario de revisión",
      recentAdjustments: "Ajustes recientes"
    }
  },
  ca: {
    common: {
      back: "Enrere",
      continue: "Continua",
      skip: "Salta",
      save: "Desa",
      retry: "Torna-ho a provar",
      help: "Ajuda",
      close: "Tanca",
      edit: "Edita",
      review: "Revisa",
      apply: "Aplica",
      approve: "Aprova",
      reject: "Rebutja",
      startOnboarding: "Comença l'onboarding",
      startWorkout: "Comença l'entrenament",
      viewWorkout: "Veure entrenament",
      openSettings: "Obre els ajustos",
      signOut: "Tanca la sessió",
      loading: "Carregant",
      language: "Idioma",
      primary: "Principal",
      secondary: "Secundària",
      profile: "Perfil",
      program: "Programa",
      today: "Avui",
      calendar: "Calendari",
      nutrition: "Nutrició",
      progress: "Progrés",
      coachPanel: "Panell de coach",
      athleteWorkspace: "Espai d'atleta",
      coachWorkspace: "Espai de coach",
      switchWorkspace: "Canviar espai",
      dashboard: "Tauler",
      athletes: "Atletes",
      reviews: "Revisions",
      notifications: "Notificacions",
      settings: "Ajustos",
      unauthorized: "Sense accés",
      networkFailure: "Error de xarxa",
      error: "Error",
      success: "Correcte",
      noData: "Sense dades"
    },
    locale: { es: "Castellà", ca: "Català", en: "Anglès", de: "Alemany" },
    nav: { today: "Avui", calendar: "Calendari", nutrition: "Nutrició", progress: "Progrés", profile: "Perfil" },
    auth: { entryTitle: "AthlexForce", entrySubtitle: "Una experiència premium per a atletes i coaches", signIn: "Inicia sessió", signUp: "Crea un compte", logout: "Surt", signedInAthlete: "Atleta autenticat", entryWelcomeBack: "Benvingut de nou", entryRestoringSession: "Restaurant la teva sessió segura.", entrySession: "Sessió", entryCheckingSession: "Comprovant l'estat d'inici de sessió guardat.", entrySessionReady: "Se t'enviarà al lloc correcte quan la sessió estigui llesta.", entryPlanWaiting: "El teu pla t'està esperant.", entryBootErrorTitle: "No hem pogut restaurar la sessió.", entryBootErrorSubtitle: "Torna-ho a provar o continua amb un inici net.", entryBootErrorTryAgain: "Torna-ho a provar", entryBootErrorSignIn: "Inicia sessió", entryAthleteHeading: "Entrada d'atleta", entrySignInHeading: "Inicia sessió", continueWithGoogle: "Continua amb Google", connectingGoogle: "Connectant...", entryDivider: "o", email: "Correu electrònic", password: "Contrasenya", showPassword: "Mostra la contrasenya", hidePassword: "Amaga la contrasenya", entryKeepSignedIn: "Manté la sessió iniciada", entrySignInButton: "Inicia sessió", entryForgotPassword: "Has oblidat la contrasenya?", entryNoAccountYet: "Encara no tens compte?", entryCreateAccount: "Crea un compte", entryAlreadyHaveAccount: "Ja tens un compte? Inicia sessió", entrySignUpHelper: "Crea un compte amb la mateixa ruta segura de Google o correu.", entrySignInHelper: "El correu usa la mateixa ruta de sessió segura que Google.", entryPasswordUpdated: "Contrasenya actualitzada. Inicia sessió de nou amb la teva nova contrasenya.", entrySignInLinkError: "No s'ha pogut completar l'enllaç d'inici de sessió. Torna-ho a provar.", entryGoogleCancelled: "L'inici amb Google s'ha cancel·lat. No s'ha canviat res.", entryStatusReady: "Inici de sessió a punt.", entryStatusUnavailable: "Inici de sessió no disponible." },
    onboarding: {
      title: "Onboarding",
      subtitle: "Configura l'atleta abans de revelar el pla.",
      introTitle: "Comença pel bàsic",
      introSubtitle: "Configura l'atleta abans de revelar el pla.",
      introBasicsTitle: "Comença pel bàsic",
      introBasicsCaption: "AthlexForce fa servir un únic context d'atleta per perfil, objectius, entrenament, nutrició, baseline i la revelació del pla.",
      whatWeSetUp: "Què configurarem",
      profileTitle: "Perfil",
      profileSubtitle: "Nom, edat, alçada, pes i unitats.",
      profileQuestion: "Com t'hem de dir?",
      profileCaption: "Mantén les mateixes dades de l'atleta a cada pas.",
      goalsTitle: "Objectius",
      goalsSubtitle: "Objectiu principal i prioritats ordenades.",
      goalsQuestion: "Defineix l'objectiu principal",
      goalsCaption: "Mantén el llenguatge visual simple. L'objectiu i les prioritats s'han de llegir bé al mòbil.",
      trainingExperienceTitle: "Experiència d'entrenament",
      trainingExperienceSubtitle: "Freqüència, confiança, càrregues i familiaritat amb moviments.",
      trainingExperienceSummary: "Resum d'experiència",
      trainingPreferencesTitle: "Preferències d'entrenament",
      trainingPreferencesSubtitle: "Dies, durada, equip, varietat i descans.",
      trainingPreferencesCaption: "Ancoratges repetibles",
      scheduleTitle: "Horari i estil de vida",
      scheduleSubtitle: "Feina, son, estrès, hidratació i franges d'entrenament.",
      healthTitle: "Salut i limitacions",
      healthSubtitle: "Mantén això tranquil, privat i sense diagnòstic.",
      nutritionTitle: "Preferències de nutrició",
      nutritionSubtitle: "Al·lèrgies, restriccions, rutina i flexibilitat.",
      baselineTitle: "Baseline",
      baselineSubtitle: "Mesures i fotos privades opcionals.",
      reviewTitle: "Revisió final",
      reviewSubtitle: "Confirma el perfil abans de construir el pla.",
      buildingPlanTitle: "Construint el teu pla",
      buildingPlanSubtitle: "Una pausa tranquil·la mentre el teu pla es prepara.",
      planReadyTitle: "El teu pla està llest",
      planReadySubtitle: "La Fase 1 està llesta per revisar fins que comencis.",
      programTitle: "Resum del programa",
      programSubtitle: "Fase 1, progrés i estructura actual.",
      identityGatewayTitle: "Com faràs servir AthlexForce?",
      identityGatewaySubtitle: "Tria la via que encaixi amb la teva manera d'entrenar. Podràs canviar-la més tard si l'accés canvia.",
      identityGatewayIndependentTitle: "Entreno pel meu compte",
      identityGatewayIndependentCopy: "Gestiono jo mateix l'entrenament i la nutrició.",
      identityGatewayCoachManagedTitle: "Entreno amb un coach",
      identityGatewayCoachManagedCopy: "El meu coach supervisa o gestiona el meu pla.",
      identityGatewayCoachTitle: "Sóc coach",
      identityGatewayCoachCopy: "Gestiono atletes amb AthlexForce.",
      identityGatewayInviteTitle: "Tens un codi d'invitació?",
      identityGatewayInviteCopy: "Enganxa un token segur per connectar una relació amb coach.",
      identityGatewayInvitePlaceholder: "Enganxa el codi",
      identityGatewayInviteButton: "Connecta el coach",
      identityGatewayInviteSuccess: "Coach connectat.",
      identityGatewayInviteError: "No s'ha pogut verificar aquest codi d'invitació.",
      identityGatewayContinue: "Continua",
      identityGatewayPendingTitle: "Sol·licitud de coach rebuda",
      identityGatewayPendingCopy: "La teva sol·licitud d'accés de coach està pendent de verificació fiable.",
      identityGatewayCoachConnected: "Coach connectat."
    },
    profile: {
      hubTitle: "Perfil",
      hubDetail: "Centre de perfil i ajustos base",
      provisionalHub: "Centre de perfil i ajustos base",
      signedInAs: "Sessió iniciada com a",
      currentPlan: "Pla actual",
      active: "Actiu",
      proposed: "Proposat",
      daysPerWeek: "Dies / setmana",
      duration: "Durada",
      location: "Ubicació",
      profileEditing: "Edició de perfil",
      notifications: "Notificacions",
      notificationsDetail: "Recordatoris d'entrenament, progrés i coaching",
      programOverview: "Resum del programa",
      developmentMode: "Mode de treball",
      settingsDetail: "Idioma, entrenament i preferències del compte",
      security: "Seguretat",
      securityDetail: "Contrasenya, sessions i accés al compte",
      workspaceMode: "Mode d'espai",
      selfManaged: "Autogestionat",
      coachManaged: "Amb coach",
      yourCoach: "El teu coach",
      planSupervised: "Pla supervisat",
      coachConnected: "Coach connectat.",
      coachPending: "Connexió amb coach pendent",
      openCoachWorkspace: "Obre l'espai de coach",
      switchToAthleteWorkspace: "Obre l'espai d'atleta",
      profileSaved: "perfil desat",
      programUpdatePending: "Actualització del programa pendent",
      noPendingProgramUpdates: "Sense actualitzacions pendents"
    },
    coach: {
      accessDeniedTitle: "Accés denegat",
      accessDeniedCopy: "Aquest compte encara no té accés de coach.",
      dashboardTitle: "Tauler de coach",
      dataNotReadyTitle: "Les dades del coach encara no estan llestes",
      dataNotReadyCopy: "Les dades de coach encara no estan llestes en aquest espai.",
      assignedAthletesOnly: "Només atletes assignats. Revisa primer els que necessiten atenció.",
      needsAttention: "Necessita atenció",
      quickLinks: "Accessos ràpids",
      athletes: "Atletes",
      reviews: "Revisions",
      profile: "Perfil",
      profileDetail: "Identitat i pla actual",
      pendingTitle: "Accés de coach pendent",
      pendingCopy: "Aquest compte té una sol·licitud de coach pendent de verificació fiable.",
      pendingBackToAthlete: "Torna a l'espai d'atleta",
      pendingRequestReceived: "SOL·LICITUD REBUDA",
      pendingRequestDetail: "Desbloquejarem l'espai de coach després de la verificació."
    },
    calendar: {
      title: "Calendari",
      previousMonth: "Mes anterior",
      nextMonth: "Mes següent",
      nutrition: "Nutrició",
      cardioHabits: "Cardio i hàbits",
      viewDay: "Veure dia",
      monthFallback: "Mes actual"
    },
    today: {
      restDay: "Dia de descans",
      recoveryDay: "Dia de recuperació",
      nextWorkout: "Proper entrenament",
      targetZones: "Zones objectiu",
      primary: "Principal",
      secondary: "Secundària",
      readyTomorrow: "A punt demà",
      duration: "Durada",
      calories: "Calories",
      cardio: "Cardio",
      volume: "Volum",
      sets: "Sèries",
      movements: "Moviments",
      posteriorChainEmphasis: "Èmfasi en la cadena posterior"
    },
    program: {
      overview: "Resum del programa",
      myProgram: "El meu programa",
      weeklyStructure: "Estructura setmanal",
      workoutTemplates: "Plantilles d'entrenament",
      keyMovements: "Moviments clau",
      progression: "Progressió",
      nutrition: "Nutrició",
      cardio: "Cardio",
      recovery: "Recuperació",
      habits: "Hàbits",
      checkIn: "Check-in",
      reviewTimeline: "Calendari de revisió",
      recentAdjustments: "Ajustos recents"
    }
  },
  de: {
    common: {
      back: "Zurück",
      continue: "Weiter",
      skip: "Überspringen",
      save: "Speichern",
      retry: "Erneut versuchen",
      help: "Hilfe",
      close: "Schließen",
      edit: "Bearbeiten",
      review: "Prüfen",
      apply: "Anwenden",
      approve: "Genehmigen",
      reject: "Ablehnen",
      startOnboarding: "Onboarding starten",
      startWorkout: "Training starten",
      viewWorkout: "Training ansehen",
      openSettings: "Einstellungen öffnen",
      signOut: "Abmelden",
      loading: "Lädt",
      language: "Sprache",
      primary: "Primär",
      secondary: "Sekundär",
      profile: "Profil",
      program: "Programm",
      today: "Heute",
      calendar: "Kalender",
      nutrition: "Ernährung",
      progress: "Fortschritt",
      coachPanel: "Coach-Panel",
      athleteWorkspace: "Athletenbereich",
      coachWorkspace: "Coach-Bereich",
      switchWorkspace: "Bereich wechseln",
      dashboard: "Übersicht",
      athletes: "Athleten",
      reviews: "Reviews",
      notifications: "Benachrichtigungen",
      settings: "Einstellungen",
      unauthorized: "Kein Zugriff",
      networkFailure: "Netzwerkfehler",
      error: "Fehler",
      success: "Erfolg",
      noData: "Keine Daten"
    },
    locale: { es: "Spanisch", ca: "Katalanisch", en: "Englisch", de: "Deutsch" },
    nav: { today: "Heute", calendar: "Kalender", nutrition: "Ernährung", progress: "Fortschritt", profile: "Profil" },
    auth: { entryTitle: "AthlexForce", entrySubtitle: "Ein hochwertiges Trainingserlebnis für Athleten und Coaches", signIn: "Anmelden", signUp: "Konto erstellen", logout: "Abmelden", signedInAthlete: "Angemeldeter Athlet", entryWelcomeBack: "Willkommen zurück", entryRestoringSession: "Wir stellen deine sichere Sitzung wieder her.", entrySession: "Sitzung", entryCheckingSession: "Wir prüfen deinen gespeicherten Anmeldestatus.", entrySessionReady: "Du wirst weitergeleitet, sobald die Sitzung bereit ist.", entryPlanWaiting: "Dein Plan wartet.", entryBootErrorTitle: "Wir konnten deine Sitzung nicht wiederherstellen.", entryBootErrorSubtitle: "Versuche es erneut oder fahre mit einer frischen Anmeldung fort.", entryBootErrorTryAgain: "Erneut versuchen", entryBootErrorSignIn: "Anmelden", entryAthleteHeading: "Athleten-Start", entrySignInHeading: "Anmelden", continueWithGoogle: "Mit Google fortfahren", connectingGoogle: "Verbinden...", entryDivider: "oder", email: "E-Mail", password: "Passwort", showPassword: "Passwort anzeigen", hidePassword: "Passwort verbergen", entryKeepSignedIn: "Angemeldet bleiben", entrySignInButton: "Anmelden", entryForgotPassword: "Passwort vergessen?", entryNoAccountYet: "Noch kein Konto?", entryCreateAccount: "Konto erstellen", entryAlreadyHaveAccount: "Schon ein Konto? Anmelden", entrySignUpHelper: "Erstelle ein Konto über denselben sicheren Google- oder E-Mail-Weg.", entrySignInHelper: "Die E-Mail-Anmeldung nutzt denselben sicheren Sitzungsweg wie Google.", entryPasswordUpdated: "Passwort aktualisiert. Melde dich mit deinem neuen Passwort erneut an.", entrySignInLinkError: "Der Anmeldelink konnte nicht abgeschlossen werden. Versuche es erneut.", entryGoogleCancelled: "Die Google-Anmeldung wurde abgebrochen. Es wurde nichts geändert.", entryStatusReady: "Anmeldung bereit.", entryStatusUnavailable: "Anmeldung derzeit nicht verfügbar." },
    onboarding: {
      title: "Onboarding",
      subtitle: "Lege das Athleten-Setup fest, bevor der Plan angezeigt wird.",
      introTitle: "Mit den Grundlagen beginnen",
      introSubtitle: "Lege das Athleten-Setup fest, bevor der Plan angezeigt wird.",
      introBasicsTitle: "Mit den Grundlagen beginnen",
      introBasicsCaption: "AthlexForce verwendet einen einheitlichen Athletenkontext für Profil, Ziele, Training, Ernährung, Baseline und Plananzeige.",
      whatWeSetUp: "Was wir einrichten",
      profileTitle: "Profil",
      profileSubtitle: "Name, Alter, Größe, Gewicht und Einheiten.",
      profileQuestion: "Wie sollen wir dich nennen?",
      profileCaption: "Verwende durchgehend dieselben Athletendaten.",
      goalsTitle: "Ziele",
      goalsSubtitle: "Hauptziel und geordnete Prioritäten.",
      goalsQuestion: "Lege das Hauptziel fest",
      goalsCaption: "Halte die visuelle Sprache einfach. Ziel und Prioritäten sollen auf Mobilgeräten klar lesbar sein.",
      trainingExperienceTitle: "Trainingserfahrung",
      trainingExperienceSubtitle: "Frequenz, Vertrauen, Lasten und Bewegungsroutine.",
      trainingExperienceSummary: "Erfahrungsübersicht",
      trainingPreferencesTitle: "Trainingspräferenzen",
      trainingPreferencesSubtitle: "Tage, Dauer, Equipment, Vielfalt und Pausen.",
      trainingPreferencesCaption: "Wiederholbare Anker",
      scheduleTitle: "Zeitplan & Lebensstil",
      scheduleSubtitle: "Arbeit, Schlaf, Stress, Hydration und Trainingsfenster.",
      healthTitle: "Gesundheit & Einschränkungen",
      healthSubtitle: "Bleibe ruhig, privat und ohne Diagnose.",
      nutritionTitle: "Ernährungspräferenzen",
      nutritionSubtitle: "Allergien, Restriktionen, Routine und Flexibilität.",
      baselineTitle: "Baseline",
      baselineSubtitle: "Messungen und optionale private Fortschrittsfotos.",
      reviewTitle: "Abschließende Prüfung",
      reviewSubtitle: "Bestätige das Profil, bevor der Plan gebaut wird.",
      buildingPlanTitle: "Plan wird erstellt",
      buildingPlanSubtitle: "Eine ruhige Pause, während dein Plan vorbereitet wird.",
      planReadyTitle: "Dein Plan ist bereit",
      planReadySubtitle: "Phase 1 ist bereit zur Prüfung, bis du startest.",
      programTitle: "Programmübersicht",
      programSubtitle: "Phase 1, Fortschritt und aktuelle Struktur.",
      identityGatewayTitle: "Wie wirst du AthlexForce nutzen?",
      identityGatewaySubtitle: "Wähle den Weg, der zu deinem Training passt. Du kannst später wechseln, wenn sich dein Zugriff ändert.",
      identityGatewayIndependentTitle: "Ich trainiere selbst",
      identityGatewayIndependentCopy: "Ich verwalte Training und Ernährung selbst.",
      identityGatewayCoachManagedTitle: "Ich trainiere mit Coach",
      identityGatewayCoachManagedCopy: "Mein Coach steuert oder überwacht meinen Plan.",
      identityGatewayCoachTitle: "Ich bin Coach",
      identityGatewayCoachCopy: "Ich verwalte Athleten mit AthlexForce.",
      identityGatewayInviteTitle: "Hast du einen Einladungs-Code?",
      identityGatewayInviteCopy: "Füge ein sicheres Token ein, um eine Coach-Verbindung herzustellen.",
      identityGatewayInvitePlaceholder: "Code einfügen",
      identityGatewayInviteButton: "Coach verbinden",
      identityGatewayInviteSuccess: "Coach verbunden.",
      identityGatewayInviteError: "Dieser Einladungs-Code konnte nicht verifiziert werden.",
      identityGatewayContinue: "Weiter",
      identityGatewayPendingTitle: "Coach-Anfrage erhalten",
      identityGatewayPendingCopy: "Deine Coach-Zugriffsanfrage wartet auf vertrauenswürdige Prüfung.",
      identityGatewayCoachConnected: "Coach verbunden."
    },
    profile: {
      hubTitle: "Profil",
      hubDetail: "Profil-Hub und Grundeinstellungen",
      provisionalHub: "Profil-Hub und Grundeinstellungen",
      signedInAs: "Angemeldet als",
      currentPlan: "Aktueller Plan",
      active: "Aktiv",
      proposed: "Vorgeschlagen",
      daysPerWeek: "Tage / Woche",
      duration: "Dauer",
      location: "Ort",
      profileEditing: "Profilbearbeitung",
      notifications: "Benachrichtigungen",
      notificationsDetail: "Erinnerungen zu Training, Fortschritt und Coaching",
      programOverview: "Programmübersicht",
      developmentMode: "Arbeitsmodus",
      settingsDetail: "Sprache, Training und Kontoeinstellungen",
      security: "Sicherheit",
      securityDetail: "Passwort, Sitzungen und Kontozugriff",
      workspaceMode: "Bereichsmodus",
      selfManaged: "Selbst verwaltet",
      coachManaged: "Mit Coach",
      yourCoach: "Dein Coach",
      planSupervised: "Plan betreut",
      coachConnected: "Coach verbunden.",
      coachPending: "Coach-Verbindung ausstehend",
      openCoachWorkspace: "Coach-Bereich öffnen",
      switchToAthleteWorkspace: "Athletenbereich öffnen",
      profileSaved: "Profil gespeichert",
      programUpdatePending: "Programmaktualisierung ausstehend",
      noPendingProgramUpdates: "Keine ausstehenden Programmaktualisierungen"
    },
    coach: {
      accessDeniedTitle: "Zugriff verweigert",
      accessDeniedCopy: "Dieses Konto ist noch nicht für den Coach-Zugang eingerichtet.",
      dashboardTitle: "Coach-Übersicht",
      dataNotReadyTitle: "Coach-Daten sind noch nicht bereit",
      dataNotReadyCopy: "Die Coach-Daten sind in diesem Arbeitsbereich noch nicht bereit.",
      assignedAthletesOnly: "Nur zugewiesene Athleten. Prüfe zuerst die mit Handlungsbedarf.",
      needsAttention: "Benötigt Aufmerksamkeit",
      quickLinks: "Schnellzugriffe",
      athletes: "Athleten",
      reviews: "Reviews",
      profile: "Profil",
      profileDetail: "Identität und aktueller Plan",
      pendingTitle: "Coach-Zugriff ausstehend",
      pendingCopy: "Dieses Konto hat eine Coach-Anfrage, die auf vertrauenswürdige Prüfung wartet.",
      pendingBackToAthlete: "Zurück zum Athletenbereich",
      pendingRequestReceived: "ANFRAGE ERHALTEN",
      pendingRequestDetail: "Wir schalten den Coach-Bereich nach der Prüfung frei."
    },
    calendar: {
      title: "Kalender",
      previousMonth: "Vorheriger Monat",
      nextMonth: "Nächster Monat",
      nutrition: "Ernährung",
      cardioHabits: "Cardio & Gewohnheiten",
      viewDay: "Tag ansehen",
      monthFallback: "Aktueller Monat"
    },
    today: {
      restDay: "Ruhetag",
      recoveryDay: "Regenerationstag",
      nextWorkout: "Nächstes Training",
      targetZones: "Zielzonen",
      primary: "Primär",
      secondary: "Sekundär",
      readyTomorrow: "Morgen bereit",
      duration: "Dauer",
      calories: "Kalorien",
      cardio: "Cardio",
      volume: "Volumen",
      sets: "Sätze",
      movements: "Übungen",
      posteriorChainEmphasis: "Fokus auf die hintere Muskelkette"
    },
    program: {
      overview: "Programmübersicht",
      myProgram: "Mein Programm",
      weeklyStructure: "Wochenstruktur",
      workoutTemplates: "Trainingsvorlagen",
      keyMovements: "Kernübungen",
      progression: "Progression",
      nutrition: "Ernährung",
      cardio: "Cardio",
      recovery: "Regeneration",
      habits: "Gewohnheiten",
      checkIn: "Check-in",
      reviewTimeline: "Review-Zeitplan",
      recentAdjustments: "Letzte Anpassungen"
    }
  }
};

export { messages as i18nMessages };

let currentLocale: Locale = "es";
const listeners = new Set<() => void>();

export function isSupportedLocale(value: string): value is Locale {
  return (supportedLocales as readonly string[]).includes(value);
}

export function normalizeLocale(value: string | null | undefined): Locale {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return "es";
  }

  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("ca")) return "ca";
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("de")) return "de";
  if (isSupportedLocale(normalized)) return normalized;
  return "es";
}

export function detectBrowserLocale() {
  if (typeof navigator === "undefined") {
    return "es" as Locale;
  }

  const candidates = [...navigator.languages, navigator.language].filter(Boolean);
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) {
      return locale;
    }
  }

  return "es" as Locale;
}

export function readPersistedLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  const fromStorage = window.localStorage.getItem(localeStorageKey);
  if (fromStorage) {
    return normalizeLocale(fromStorage);
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${localeCookieName}=([^;]*)`));
  if (match?.[1]) {
    return normalizeLocale(decodeURIComponent(match[1]));
  }

  return null;
}

export function getInitialLocale(preferredLocale?: string | null) {
  if (preferredLocale != null) {
    return normalizeLocale(preferredLocale);
  }

  return readPersistedLocale() ?? detectBrowserLocale() ?? "es";
}

export function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") {
    return;
  }

  const secureAttribute = typeof window !== "undefined" && window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${localeCookieName}=${encodeURIComponent(locale)}; path=/; max-age=31536000; samesite=lax${secureAttribute}`;
}

export function setCurrentLocale(nextLocale: Locale) {
  currentLocale = normalizeLocale(nextLocale);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(localeStorageKey, currentLocale);
    setLocaleCookie(currentLocale);
  }
  listeners.forEach((listener) => listener());
}

export function bootstrapLocale() {
  setCurrentLocale(getInitialLocale());
}

export function getCurrentLocale() {
  return currentLocale;
}

export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTranslation(locale: Locale, path: string): string {
  const segments = path.split(".");
  const resolve = (tree: unknown) => segments.reduce<unknown>((value, segment) => {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    return (value as Record<string, unknown>)[segment];
  }, tree);

  const localized = resolve(messages[locale]);
  const english = resolve(messages.en);
  const value = localized ?? english;
  return typeof value === "string" ? value : path;
}

export function formatDate(date: Date, options: Intl.DateTimeFormatOptions & { locale?: Locale } = {}) {
  const { locale, ...dateOptions } = options;
  return new Intl.DateTimeFormat(locale ?? currentLocale, dateOptions).format(date);
}

export function formatNumber(value: number, options: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat(currentLocale, options).format(value);
}
