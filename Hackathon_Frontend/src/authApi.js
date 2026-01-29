import axios from "axios";

export default class Authentication {
    constructor() {
        // Use environment variable or fallback to localhost for development
        this.BASE = process.env.REACT_APP_AUTH_URL || "http://127.0.0.1:7000/api/auth/"
    }

    async register(data) {
        console.log(JSON.stringify(data));
        const response = await axios.post(
            this.BASE + "register/",
            JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        if(response.status === 201) {
            return true;
        }
        return false;
    }

    async login(data) {
        const response = await axios.post(
            this.BASE + "login/",
            JSON.stringify(data), {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if(response.status === 200){
            sessionStorage.setItem("accessToken", response.data.access);
            sessionStorage.setItem("refreshToken", response.data.refresh);
            sessionStorage.setItem("user", response.data.user.username);
            
            // Store admin flag
            sessionStorage.setItem("isAdmin", response.data.user.is_admin || false);
            
            return {
                success: true,
                isAdmin: response.data.user.is_admin || false
            };
        }
        return null;
    }
}
