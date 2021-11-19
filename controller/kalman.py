# shout out to:
# https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python
# https://arxiv.org/pdf/1204.0375.pdf


import numpy as np

class KalmanFilter:

    # constuctor parameters :
    # X : The mean state estimate
    # P : The state covariance matrix
    # F : Function that takes in dt and returns the state transition n n × matrix.
    # Q : The process noise covariance matrix.
    # B : Function that takes in dt and returns the input effect matrix.
    # H : The measurement matrix
    # R : The measurement covariance matrix

    def __init__(self, X, P, F, Q, B, U, H, R):
        self.X = X 
        self.P = P
        self.F = F 
        self.Q = Q
        self.B = B
        self.H = H
        self.R = R

        print("initialized")

    # predict
    # brief: make a prediction of the current state given the old state,
    #   the elapsed time and control input
    # 
    # inputs:
    # U  : The control input matrix
    # dt : The time passed since the last predict or update

    def predict(self, U, dt):
        self.X = np.dot(self.F(dt), self.X) + np.dot(self.B(dt), U)
        self.P = np.dot(self.F(dt), np.dot(self.P, self.F(dt).T)) + self.Q

    # update
    # brief: update the mean state and covariance based on a new measurement
    # 
    # inputs:
    # Z  : the latest measurement 
    #
    # out: 
    # K : the Kalman Gain matrix
    # IM : the Mean of predictive distribution of Y
    # IS : the Covariance or predictive mean of Y

    def update(self, Z):
        IM = np.dot(self.H, self.X)
        IS = self.R + np.dot(self.H, np.dot(self.P, self.H.T))
        K = np.dot(self.P, np.dot(self.H.T, np.linalg.inv(IS)))
        self.X = self.X + np.dot(K, (Z-IM))
        self.P = self.P - np.dot(K, np.dot(IS, K.T))
        return (K,IM,IS) 

    def step(self, U, Z, dt):
        self.predict(U, dt)
        K, IM, IS = self.update(Z)


if __name__ == "__main__":


    # predict: 

    # initial state array (where we think things are)
    X = np.array([  [1.0],
                    [5.0]])
    # initial covariance array (how sure we are)
    P = np.diag(    [10.0, 1.0])

    # state transition (how we update X based on itself)
    F = lambda dt : np.array([  [1, dt],
                                [0, 1]])

    # process noise covariance (how much less certain we are about the measurement as time progresses)
    Q = np.array([  [0.05, 0.4],
                    [0.4, 1.2]])

    # input effect matrix (how inputs get translated into the state matrix)
    B = lambda dt : np.array([  [10*dt, 0.0],
                                [0.0, 0.0]])

    # input matrix (external inputs into our system)
    U = np.array([  [0.0],
                    [0.0]])

    #kf.predict(X, P, F, Q, B, U)

    print(X)

    # update: 

    # new measurement vector (we'll say that a measurement will be 10x the state variable)
    Z = np.array(   [70.0, 120.0, 170.0])

    # measurement matrix (how to go from the state space to the measurement space)
    H = np.array([  [10.0, 0.0]])

    # measurement covariance matrix (how much noise we think is in the sensor)
    R = np.array(   [1])


    #kf.update(X, P, Z, H, R)


    kf = KalmanFilter(X, P, F, Q, B, U, H, R)

    for i in range(3):
        kf.step(U, Z[i], 1)

        print(kf.X)
