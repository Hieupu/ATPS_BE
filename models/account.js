class Account {
  constructor({ AccID, username, Email, Phone, Password, Status, Provider }) {
    this.AccID = AccID;
    this.username = username;
    this.Email = Email;
    this.Phone = Phone;
    this.Password = Password;
    this.Status = Status;
    this.Provider = Provider || "local";
  }
}

module.exports = Account;
