class Account {
  constructor({ AccID, Username, Email, Phone, Password, Status, Provider }) {
    this.AccID = AccID;
    this.Username = Username;
    this.Email = Email?.trim().toLowerCase();
    this.Phone = Phone;
    this.Password = Password;
    this.Status = Status;
    this.Provider = Provider || "local";
  }
}
module.exports = Account;
