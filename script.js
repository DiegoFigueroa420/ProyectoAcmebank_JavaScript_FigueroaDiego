class BankApp {
    constructor() {
        this.currentUser = null;
        this.users = this.loadFromStorage('bankUsers', []);
        this.accounts = this.loadFromStorage('bankAccounts', []);
        this.transactions = this.loadFromStorage('bankTransactions', []);
        this.recoveryUser = null; // Used for password recovery process
        this.init();
    }

    init() {
        const path = window.location.pathname;
        const page = path.split('/').pop() || 'index.html';
        
        switch (page) {
            case 'index.html':
            case '':
                this.initLandingPage();
                break;
            case 'register.html':
                this.initRegister();
                break;
            case 'recovery.html':
                this.initRecovery();
                break;
            case 'dashboard.html':
                this.initDashboard();
                break;
        }
    }

    // Utility methods
    loadFromStorage(key, defaultValue) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return defaultValue;
        }
    }

    saveData() {
        try {
            localStorage.setItem('bankUsers', JSON.stringify(this.users));
            localStorage.setItem('bankAccounts', JSON.stringify(this.accounts));
            localStorage.setItem('bankTransactions', JSON.stringify(this.transactions));
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }

    generateAccountNumber() {
        // Generates a 12-digit account number starting with '10'
        return '10' + Math.random().toString().slice(2, 12).padStart(10, '0');
    }

    generateReferenceNumber() {
        // Generates a 9-character reference number starting with 'REF'
        return 'REF' + Math.random().toString().slice(2, 8).padStart(6, '0');
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 2
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showMessage(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.textContent = message;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        
        // Hide message after 5 seconds
        setTimeout(() => {
            element.classList.add('hidden');
        }, 5000);
    }

    // Landing page methods
    initLandingPage() {
        this.initLogin();
        this.initScrollEffects();
        this.initSmoothScrolling();
        this.initAnimations();
    }

    initScrollEffects() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    }

    initSmoothScrolling() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const target = document.getElementById(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                }
            });
        });
    }

    initAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                }
            });
        }, {
            threshold: 0.1, // Trigger when 10% of the element is visible
            rootMargin: '0px 0px -50px 0px' // Shrink the viewport by 50px from the bottom
        });

        document.querySelectorAll('.product-card, .service-item, .feature').forEach((element, index) => {
            element.style.animationDelay = `${index * 100}ms`; // Stagger animations
            element.style.animationPlayState = 'paused'; // Pause until visible
            observer.observe(element);
        });
    }

    // Login methods
    initLogin() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const credentials = {
            idType: formData.get('idType'),
            idNumber: formData.get('idNumber'),
            password: formData.get('password')
        };

        const user = this.users.find(u =>
            u.idType === credentials.idType &&
            u.idNumber === credentials.idNumber &&
            u.password === credentials.password
        );

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = 'dashboard.html';
        } else {
            this.showMessage('loginMessage', 'No se pudo validar su identidad. Verifique sus credenciales.', 'error');
        }
    }

    // Register methods
    initRegister() {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const userData = {
            idType: formData.get('regIdType'),
            idNumber: formData.get('regIdNumber'),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            gender: formData.get('gender'),
            phone: formData.get('phone'),
            birthDate: formData.get('birthDate'),
            occupation: formData.get('occupation'),
            email: formData.get('email'),
            address: formData.get('address'),
            city: formData.get('city'),
            country: formData.get('country'),
            monthlyIncome: parseFloat(formData.get('monthlyIncome')), // Parse to number
            incomeSource: formData.get('incomeSource'),
            password: formData.get('password')
        };

        // Validation
        for (const [key, value] of Object.entries(userData)) {
            // Check for empty strings or NaN for monthlyIncome
            if (!value || (typeof value === 'string' && value.trim() === '') || (key === 'monthlyIncome' && isNaN(value))) {
                this.showMessage('registerMessage', 'Todos los campos son obligatorios.', 'error');
                return;
            }
        }

        // Check if user already exists by ID
        if (this.users.some(u => u.idType === userData.idType && u.idNumber === userData.idNumber)) {
            this.showMessage('registerMessage', 'Ya existe un usuario con este tipo y número de identificación.', 'error');
            return;
        }

        // Check if user already exists by email
        if (this.users.some(u => u.email === userData.email)) {
            this.showMessage('registerMessage', 'Ya existe un usuario con este correo electrónico.', 'error');
            return;
        }

        // Password length validation
        if (userData.password.length < 8) {
            this.showMessage('registerMessage', 'La contraseña debe tener al menos 8 caracteres.', 'error');
            return;
        }

        // Terms and conditions checkbox validation
        if (!formData.get('terms')) {
            this.showMessage('registerMessage', 'Debe aceptar los términos y condiciones.', 'error');
            return;
        }

        // Create user
        const newUser = {
            ...userData,
            id: Date.now(), // Unique ID for the user
            createdDate: new Date().toISOString()
        };

        this.users.push(newUser);

        // Create account for the new user
        const newAccount = {
            id: Date.now() + 1, // Unique ID for the account
            accountNumber: this.generateAccountNumber(),
            userId: newUser.id, // Link account to user
            balance: 0, // Initial balance
            createdDate: newUser.createdDate,
            status: 'active'
        };

        this.accounts.push(newAccount);
        this.saveData(); // Save all data to localStorage

        // Show success message with account details
        const messageElement = document.getElementById('registerMessage');
        if (messageElement) {
            messageElement.innerHTML = `
                <div class="success-summary">
                    <h3>¡Cuenta creada exitosamente!</h3>
                    <p><strong>Número de cuenta:</strong> ${newAccount.accountNumber}</p>
                    <p><strong>Fecha de creación:</strong> ${this.formatDate(newAccount.createdDate)}</p>
                    <p><strong>Titular:</strong> ${newUser.firstName} ${newUser.lastName}</p>
                    <a href="index.html" class="btn btn-primary" style="margin-top:1rem;">Ir al Inicio de Sesión</a>
                </div>
            `;
            messageElement.className = 'message success';
            messageElement.classList.remove('hidden');
        }

        e.target.reset(); // Clear the form
    }

    // Recovery methods
    initRecovery() {
        const recoveryForm = document.getElementById('recoveryForm');
        const newPasswordForm = document.getElementById('newPasswordForm');
        
        if (recoveryForm) {
            recoveryForm.addEventListener('submit', (e) => this.handleRecovery(e));
        }
        
        if (newPasswordForm) {
            newPasswordForm.addEventListener('submit', (e) => this.handleNewPassword(e));
        }
    }

    handleRecovery(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const recoveryData = {
            idType: formData.get('recoveryIdType'),
            idNumber: formData.get('recoveryIdNumber'),
            email: formData.get('recoveryEmail')
        };

        const user = this.users.find(u =>
            u.idType === recoveryData.idType &&
            u.idNumber === recoveryData.idNumber &&
            u.email === recoveryData.email
        );

        if (user) {
            this.recoveryUser = user; // Store user temporarily for password assignment
            document.getElementById('recoveryForm').classList.add('hidden');
            document.getElementById('newPasswordForm').classList.remove('hidden');
            this.showMessage('recoveryMessage', 'Datos verificados. Ingrese nueva contraseña.', 'success');
        } else {
            this.showMessage('recoveryMessage', 'Los datos no coinciden con ningún usuario registrado.', 'error');
        }
    }

    handleNewPassword(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newPassword = formData.get('newPassword');
        const confirmNewPassword = formData.get('confirmNewPassword');

        if (newPassword.length < 8) {
            this.showMessage('recoveryMessage', 'La contraseña debe tener al menos 8 caracteres.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            this.showMessage('recoveryMessage', 'Las contraseñas no coinciden.', 'error');
            return;
        }

        if (this.recoveryUser) {
            const userIndex = this.users.findIndex(u => u.id === this.recoveryUser.id);
            if (userIndex !== -1) {
                this.users[userIndex].password = newPassword; // Update password
                this.saveData(); // Save updated user data

                const messageElement = document.getElementById('recoveryMessage');
                if (messageElement) {
                    messageElement.innerHTML = `
                        <div class="success-summary">
                            <h3>¡Contraseña actualizada exitosamente!</h3>
                            <a href="index.html" class="btn btn-primary" style="margin-top:1rem;">Ir al Inicio de Sesión</a>
                        </div>
                    `;
                    messageElement.className = 'message success';
                    messageElement.classList.remove('hidden');
                }

                document.getElementById('newPasswordForm').classList.add('hidden');
                this.recoveryUser = null; 
            }
        }
    }

    // Dashboard methods
    initDashboard() {
        const currentUserData = localStorage.getItem('currentUser');
        if (!currentUserData) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(currentUserData);
        } catch (error) {
            console.error('Error parsing current user data:', error);
            window.location.href = 'index.html';
            return;
        }

        this.setupDashboard();
        this.setupMenuNavigation();
        this.setupTransactionForms();
        // Initial load of sections
        this.showSection('account-summary');
        // Set active menu item for initial section
        document.querySelector('.menu-item[data-section="account-summary"]').classList.add('active');
    }

    setupDashboard() {
        const welcomeElement = document.getElementById('userWelcome');
        if (welcomeElement) {
            welcomeElement.textContent = `Bienvenido, ${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }

        // Setup user info in account-info section
        const fullNameElement = document.getElementById('fullName');
        const userEmailElement = document.getElementById('userEmail');
        
        if (fullNameElement) {
            fullNameElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
        
        if (userEmailElement) {
            userEmailElement.textContent = this.currentUser.email;
        }
    }

    setupMenuNavigation() {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);
                
                // Update active menu item
                document.querySelectorAll('.menu-item').forEach(menuItem => {
                    menuItem.classList.remove('active');
                });
                item.classList.add('active');
            });
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Load section-specific data
        switch (sectionId) {
            case 'account-summary':
                this.loadAccountSummary();
                this.loadTransactions('summary'); // Load only for summary table
                break;
            case 'account-info':
                this.loadAccountInfo();
                break;
            case 'transactions':
                this.loadTransactions('full'); // Load all transactions for full history
                break;
            case 'deposit':
                this.populateTransactionFormUserInfo('deposit');
                break;
            case 'withdrawal':
                this.populateTransactionFormUserInfo('withdrawal');
                break;
            case 'payments':
                this.populateTransactionFormUserInfo('payments');
                break;
            case 'statement':
                this.populateTransactionFormUserInfo('statement');
                // Hide statement result initially
                document.getElementById('statementResult').classList.add('hidden');
                break;
            case 'certificate':
                this.loadCertificate();
                break;
        }
    }

    populateTransactionFormUserInfo(formType) {
        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) return;

        const formPrefix = formType; // e.g., 'deposit', 'withdrawal', 'payments', 'statement'

        const accountNumberElement = document.getElementById(`${formPrefix}AccountNumber`);
        const accountHolderElement = document.getElementById(`${formPrefix}AccountHolder`);

        if (accountNumberElement) accountNumberElement.textContent = account.accountNumber;
        if (accountHolderElement) accountHolderElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }

    loadAccountSummary() {
        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) return;

        const accountNumberElement = document.getElementById('accountNumber');
        const accountBalanceElement = document.getElementById('accountBalance');
        const accountHolderElement = document.getElementById('accountHolder');
        const accountCreatedElement = document.getElementById('accountCreated');

        if (accountNumberElement) accountNumberElement.textContent = account.accountNumber;
        if (accountBalanceElement) accountBalanceElement.textContent = this.formatCurrency(account.balance);
        if (accountHolderElement) accountHolderElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        if (accountCreatedElement) accountCreatedElement.textContent = this.formatDate(account.createdDate);
    }

    loadAccountInfo() {
        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) return;

        // User Personal Info
        document.getElementById('fullName').textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        const idTypeNames = {
            cedula: 'Cédula de Ciudadanía',
            'cedula-extranjeria': 'Cédula de Extranjería',
            pasaporte: 'Pasaporte',
            'tarjeta-identidad': 'Tarjeta de Identidad'
        };
        document.getElementById('accountInfoIdType').textContent = idTypeNames[this.currentUser.idType] || this.currentUser.idType;
        document.getElementById('accountInfoIdNumber').textContent = this.currentUser.idNumber;
        document.getElementById('accountInfoGender').textContent = this.currentUser.gender;
        document.getElementById('accountInfoBirthDate').textContent = this.formatDate(this.currentUser.birthDate);
        document.getElementById('accountInfoOccupation').textContent = this.currentUser.occupation; // Assuming you add this ID in HTML

        // User Contact Info
        document.getElementById('userEmail').textContent = this.currentUser.email;
        document.getElementById('accountInfoPhone').textContent = this.currentUser.phone;
        document.getElementById('accountInfoAddress').textContent = this.currentUser.address;
        document.getElementById('accountInfoCity').textContent = this.currentUser.city;
        document.getElementById('accountInfoCountry').textContent = this.currentUser.country;

        // Account Info
        document.getElementById('accountInfoNumber').textContent = account.accountNumber;
        document.getElementById('accountInfoBalance').textContent = this.formatCurrency(account.balance);
        document.getElementById('accountInfoCreated').textContent = this.formatDate(account.createdDate);
    }

    loadTransactions(scope = 'summary') {
        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) return;

        let transactionsToDisplay = this.transactions
            .filter(t => t.accountNumber === account.accountNumber)
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

        if (scope === 'summary') {
            transactionsToDisplay = transactionsToDisplay.slice(0, 10); // Get only last 10 for summary
        }

        const tableBodyId = scope === 'summary' ? 'transactionsSummaryTableBody' : 'transactionsFullTableBody';
        const tableBody = document.getElementById(tableBodyId);
        if (!tableBody) return;

        if (transactionsToDisplay.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No hay transacciones disponibles</td></tr>';
        } else {
            tableBody.innerHTML = transactionsToDisplay.map(transaction => `
                <tr>
                    <td>${this.formatDate(transaction.date)}</td>
                    <td>${transaction.reference}</td>
                    <td><span class="transaction-type ${transaction.type.toLowerCase().replace(/\s/g, '')}">${transaction.type}</span></td>
                    <td>${transaction.description}</td>
                    <td class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(transaction.amount)}</td>
                </tr>
            `).join('');
        }
    }

    setupTransactionForms() {
        const formTypes = ['deposit', 'withdrawal', 'payments', 'statement'];
        
        formTypes.forEach(type => {
            const form = document.getElementById(type + 'Form');
            if (form) {
                // Dynamically call the correct handler method
                const handlerName = 'handle' + type.charAt(0).toUpperCase() + type.slice(1);
                if (typeof this[handlerName] === 'function') {
                    form.addEventListener('submit', (e) => this[handlerName](e));
                }
            }
        });
    }

    handleDeposit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('depositAmount'));

        if (isNaN(amount) || amount <= 0) {
            this.showMessage('dashboardMessage', 'El monto debe ser un número positivo.', 'error');
            return;
        }

        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) {
            this.showMessage('dashboardMessage', 'No se encontró la cuenta del usuario.', 'error');
            return;
        }

        const transaction = {
            id: Date.now(),
            accountNumber: account.accountNumber,
            reference: this.generateReferenceNumber(),
            type: 'Consignación',
            description: 'Consignación por canal electrónico',
            amount: amount,
            date: new Date().toISOString()
        };

        // Update account balance
        const accountIndex = this.accounts.findIndex(a => a.accountNumber === account.accountNumber);
        this.accounts[accountIndex].balance += amount;
        
        this.transactions.push(transaction);
        this.saveData();

        this.showMessage('dashboardMessage', `Consignación realizada exitosamente. Referencia: ${transaction.reference}`, 'success');
        e.target.reset();
        this.loadAccountSummary(); // Update summary display
        this.loadTransactions('summary'); // Update summary transactions table
        this.loadTransactions('full'); // Update full transactions table
        this.showTransactionSummary(transaction); // Show transaction summary
    }

    handleWithdrawal(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('withdrawalAmount'));

        if (isNaN(amount) || amount <= 0) {
            this.showMessage('dashboardMessage', 'El monto debe ser un número positivo.', 'error');
            return;
        }

        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) {
            this.showMessage('dashboardMessage', 'No se encontró la cuenta del usuario.', 'error');
            return;
        }
        if (account.balance < amount) {
            this.showMessage('dashboardMessage', 'Saldo insuficiente para realizar esta operación.', 'error');
            return;
        }

        const transaction = {
            id: Date.now(),
            accountNumber: account.accountNumber,
            reference: this.generateReferenceNumber(),
            type: 'Retiro',
            description: 'Retiro de dinero',
            amount: -amount, // Negative amount for withdrawal
            date: new Date().toISOString()
        };

        // Update account balance
        const accountIndex = this.accounts.findIndex(a => a.accountNumber === account.accountNumber);
        this.accounts[accountIndex].balance -= amount;
        
        this.transactions.push(transaction);
        this.saveData();

        this.showMessage('dashboardMessage', `Retiro realizado exitosamente. Referencia: ${transaction.reference}`, 'success');
        e.target.reset();
        this.loadAccountSummary();
        this.loadTransactions('summary');
        this.loadTransactions('full');
        this.showTransactionSummary(transaction);
    }

    handlePayments(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const serviceType = formData.get('serviceType');
        const serviceReference = formData.get('serviceReference');
        const amount = parseFloat(formData.get('paymentAmount'));

        if (isNaN(amount) || amount <= 0) {
            this.showMessage('dashboardMessage', 'El monto debe ser un número positivo.', 'error');
            return;
        }
        if (!serviceType || serviceType.trim() === '' || !serviceReference || serviceReference.trim() === '') {
            this.showMessage('dashboardMessage', 'Debe seleccionar un servicio y proporcionar una referencia.', 'error');
            return;
        }

        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) {
            this.showMessage('dashboardMessage', 'No se encontró la cuenta del usuario.', 'error');
            return;
        }
        if (account.balance < amount) {
            this.showMessage('dashboardMessage', 'Saldo insuficiente para realizar este pago.', 'error');
            return;
        }

        const serviceNames = {
            energia: 'Energía',
            agua: 'Agua',
            gas: 'Gas Natural',
            internet: 'Internet',
            telefono: 'Teléfono'
        };

        const transaction = {
            id: Date.now(),
            accountNumber: account.accountNumber,
            reference: this.generateReferenceNumber(),
            type: 'Pago de servicios',
            description: `Pago de ${serviceNames[serviceType] || serviceType} - Ref: ${serviceReference}`,
            amount: -amount, // Negative amount for payment
            date: new Date().toISOString()
        };

        // Update account balance
        const accountIndex = this.accounts.findIndex(a => a.accountNumber === account.accountNumber);
        this.accounts[accountIndex].balance -= amount;
        
        this.transactions.push(transaction);
        this.saveData();

        this.showMessage('dashboardMessage', `Pago realizado exitosamente. Referencia: ${transaction.reference}`, 'success');
        e.target.reset();
        this.loadAccountSummary();
        this.loadTransactions('summary');
        this.loadTransactions('full');
        this.showTransactionSummary(transaction);
    }

    handleStatement(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const year = parseInt(formData.get('statementYear'), 10);
        const month = parseInt(formData.get('statementMonth'), 10); // Month is 1-12

        if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
            this.showMessage('dashboardMessage', 'Año inválido. Por favor, ingrese un año válido.', 'error');
            return;
        }
        if (isNaN(month) || month < 1 || month > 12) {
            this.showMessage('dashboardMessage', 'Mes inválido. Por favor, seleccione un mes válido.', 'error');
            return;
        }

        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) {
            this.showMessage('dashboardMessage', 'No se encontró la cuenta del usuario.', 'error');
            return;
        }

        const filteredTransactions = this.transactions
            .filter(t => {
                const transactionDate = new Date(t.date);
                return t.accountNumber === account.accountNumber && transactionDate.getFullYear() === year &&
                       transactionDate.getMonth() === (month - 1); // Month is 0-11 in Date object
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        const statementTableBody = document.getElementById('statementTableBody');
        const statementResult = document.getElementById('statementResult');
        
        if (statementTableBody) {
            if (filteredTransactions.length === 0) {
                statementTableBody.innerHTML = '<tr><td colspan="5" class="no-data">No hay transacciones para el período seleccionado</td></tr>';
            } else {
                statementTableBody.innerHTML = filteredTransactions.map(transaction => `
                    <tr>
                        <td>${this.formatDate(transaction.date)}</td>
                        <td>${transaction.reference}</td>
                        <td><span class="transaction-type ${transaction.type.toLowerCase().replace(/\s/g, '')}">${transaction.type}</span></td>
                        <td>${transaction.description}</td>
                        <td class="transaction-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">${this.formatCurrency(transaction.amount)}</td>
                    </tr>
                `).join('');
            }
        }

        if (statementResult) {
            statementResult.classList.remove('hidden');
        }
    }
    loadCertificate() {
        const account = this.accounts.find(a => a.userId === this.currentUser.id);
        if (!account) {
            this.showMessage('dashboardMessage', 'No se encontró la cuenta del usuario para generar el certificado.', 'error');
            return;
        }

        const certificateNumber = 'CERT-' + Date.now();
        const currentDate = new Date();
        
        const idTypeNames = {
            cedula: 'Cédula de Ciudadanía',
            'cedula-extranjeria': 'Cédula de Extranjería',
            pasaporte: 'Pasaporte',
            'tarjeta-identidad': 'Tarjeta de Identidad'
        };

        const elements = {
            certificateNumber: document.getElementById('certificateNumber'),
            certificateHolder: document.getElementById('certificateHolder'),
            certificateIdType: document.getElementById('certificateIdType'),
            certificateIdNumber: document.getElementById('certificateIdNumber'),
            certificateAccountNumber: document.getElementById('certificateAccountNumber'),
            certificateAccountDate: document.getElementById('certificateAccountDate'),
            certificateIssueDate: document.getElementById('certificateIssueDate')
        };

        // Populate elements if they exist
        if (elements.certificateNumber) elements.certificateNumber.textContent = certificateNumber;
        if (elements.certificateHolder) elements.certificateHolder.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        if (elements.certificateIdType) elements.certificateIdType.textContent = idTypeNames[this.currentUser.idType] || this.currentUser.idType;
        if (elements.certificateIdNumber) elements.certificateIdNumber.textContent = this.currentUser.idNumber;
        if (elements.certificateAccountNumber) elements.certificateAccountNumber.textContent = account.accountNumber;
        if (elements.certificateAccountDate) elements.certificateAccountDate.textContent = this.formatDate(account.createdDate);
        if (elements.certificateIssueDate) elements.certificateIssueDate.textContent = this.formatDate(currentDate.toISOString());


        document.getElementById('certificateContent').classList.remove('hidden');
    }

    showTransactionSummary(transaction) {
        const summarySection = document.getElementById('transaction-summary-details');
        if (!summarySection) return;

        document.getElementById('summaryTxnDate').textContent = this.formatDate(transaction.date);
        document.getElementById('summaryTxnReference').textContent = transaction.reference;
        document.getElementById('summaryTxnType').textContent = transaction.type;
        document.getElementById('summaryTxnDescription').textContent = transaction.description;
        document.getElementById('summaryTxnAmount').textContent = this.formatCurrency(transaction.amount);

        summarySection.classList.remove('hidden');
        // Hide after 10 seconds
        setTimeout(() => {
            summarySection.classList.add('hidden');
        }, 10000);
    }

    logout() {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const btn = field.nextElementSibling; 
    const icon = btn.querySelector('i');
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function printTransactions(scope = 'summary') {
    let contentToPrint = '';
    let title = '';
    if (scope === 'summary') {
        contentToPrint = document.getElementById('transactions-summary-table').outerHTML;
        title = 'Resumen de Últimas Transacciones';
    } else if (scope === 'full') {
        contentToPrint = document.getElementById('transactions-full-table').outerHTML;
        title = 'Historial Completo de Transacciones';
    } else if (scope === 'statement') {
        contentToPrint = document.getElementById('statementResult').outerHTML;
        title = 'Extracto Bancario';
    }

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: 'Inter', sans-serif; margin: 20px; color: #333; }
                h1 { color: #1e3c72; text-align: center; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
                th { background: #f8fafc; color: #374151; font-weight: 600; }
                .no-data { text-align: center; font-style: italic; color: #9ca3af; }
                .transaction-type { padding: 4px 8px; border-radius: 15px; font-size: 0.8em; font-weight: 500; }
                .transaction-type.consignación { background: #d1fae5; color: #065f46; }
                .transaction-type.retiro { background: #fee2e2; color: #991b1b; }
                .transaction-type.pagodeservicios { background: #dbeafe; color: #1e40af; }
                .transaction-amount.positive { color: #059669; font-weight: 600; }
                .transaction-amount.negative { color: #dc2626; font-weight: 600; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            ${contentToPrint}
        </body>
        </html>
    `);
    win.document.close();
    win.print();
}

function printCertificate() {
    const content = document.getElementById('certificateContent').outerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
        <head>
            <title>Certificado Bancario</title>
            <style>
                body { font-family: 'Inter', sans-serif; margin: 20px; color: #333; }
                .certificate { 
                    max-width: 800px; margin: auto; padding: 30px; 
                    border: 2px solid #1e3c72; border-radius: 10px; 
                    background: #f8fafc; text-align: center;
                }
                .bank-logo { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 20px; }
                .bank-logo i { font-size: 3em; color: #1e3c72; }
                .bank-logo h1 { font-size: 2.5em; color: #1e3c72; margin: 0; }
                .certificate-title { font-size: 1.8em; color: #1e3c72; margin-bottom: 20px; }
                .certificate-body { text-align: left; line-height: 1.8; margin-bottom: 30px; }
                .certificate-body p { margin-bottom: 10px; }
                .certificate-body strong { color: #1e3c72; }
                .certificate-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #cbd5e1; }
                .certificate-signature { text-align: center; }
                .certificate-signature strong { display: block; margin-top: 10px; border-top: 2px solid #1e3c72; padding-top: 5px; }
            </style>
        </head>
        <body>
            ${content}
        </body>
        </html>
    `);
    win.document.close();
    win.print();
}

function handleContactForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const subject = formData.get('subject');
    const message = formData.get('message');

    if (!name || !email || !subject || !message) {
        alert('Por favor, complete todos los campos del formulario de contacto.');
        return;
    }

    alert('¡Gracias por contactarnos, ' + name + '! Hemos recibido su mensaje y nos pondremos en contacto pronto.');
    e.target.reset();
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('show');
    document.body.style.overflow = 'hidden'; 
}
function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('show');
    document.body.style.overflow = 'auto'; 
    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) {
        loginMessage.classList.add('hidden');
        loginMessage.textContent = '';
    }
}
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    if (navMenu && navToggle) {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    }
}
function scrollToProducts() {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
}

document.addEventListener('click', e => {
    if (e.target.id === 'loginModal') { 
        closeLoginModal();
    }
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    window.bankApp = new BankApp();
    
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
});

