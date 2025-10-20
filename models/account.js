class Account {
  constructor({
    AccountID,
    Username,
    Email,
    Phone,
    Password,
    Status,
    Provider,
  }) {
    this.AccountID = AccountID;
    this.Username = Username;
    this.Email = Email;
    this.Phone = Phone;
    this.Password = Password;
    this.Status = Status;
    this.Provider = Provider || "local";
  }
}

module.exports = Account;
