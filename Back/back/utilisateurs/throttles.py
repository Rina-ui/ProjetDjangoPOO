from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    rate = "10/min"


class TwoFALoginRateThrottle(AnonRateThrottle):
    rate = "20/min"


class TwoFAVerifyRateThrottle(UserRateThrottle):
    rate = "30/min"

