function phoneNumberValidator(x) {
    const phone_regex = /^(?:(?:\+|00)48|0)?[1-9][0-9]{8}$/
    const match = x.match(phone_regex)
    if (!match) {
        return false
    }
    return true
}

module.exports = { phoneNumberValidator }